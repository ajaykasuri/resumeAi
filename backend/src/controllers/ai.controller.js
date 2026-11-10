const crypto = require('crypto');
const { query, queryOne } = require('../config/database');

// Utility to create cache key from inputs
function createCacheKey(jobRole, skills, experienceLevel) {
  const normalized = `${jobRole.toLowerCase().trim()}|${skills.toLowerCase().replace(/\s+/g, ' ').trim()}|${experienceLevel}`;
  return crypto.createHash('md5').update(normalized).digest('hex');
}

// Similarity check: check if skills overlap > 70%
function skillsSimilarity(skills1, skills2) {
  const arr1 = skills1.toLowerCase().split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  const arr2 = skills2.toLowerCase().split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
  const intersection = arr1.filter(s => arr2.some(s2 => s2.includes(s) || s.includes(s2)));
  return intersection.length / Math.max(arr1.length, arr2.length, 1);
}

async function generateWithGemini(prompt) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateWithOpenAI(prompt) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.7,
  });
  return completion.choices[0].message.content;
}

async function callAI(prompt) {
  const provider = process.env.AI_PROVIDER || 'gemini';
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return await generateWithOpenAI(prompt);
  }
  return await generateWithGemini(prompt);
}

function buildResumePrompt(data) {
  return `You are an expert resume writer. Generate professional ATS-optimized resume content for:

Name: ${data.name || 'Professional Name'}
Target Job Role: ${data.jobRole}
Experience Level: ${data.experienceLevel || 'mid'}
Skills: ${data.skills}
Education: ${data.education || 'Not specified'}
Additional Context: ${data.additionalContext || 'None'}

Generate a complete JSON response with this EXACT structure (no markdown, no backticks, pure JSON):
{
  "summary": "3-4 sentence professional summary with ATS keywords",
  "objective": "1-2 sentence career objective",
  "skills": {
    "categories": [
      {
        "name": "Category Name",
        "skills": ["skill1", "skill2", "skill3"]
      }
    ]
  },
  "experience": [
    {
      "jobTitle": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Month Year",
      "endDate": "Present or Month Year",
      "description": "2-3 bullet points with quantifiable achievements using ACTION VERB. Start with strong verbs. Include metrics.",
      "bullets": [
        "Led development of X resulting in Y% improvement",
        "Implemented Z which reduced costs by $X",
        "Collaborated with team of N engineers to deliver..."
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description with tech stack and impact",
      "technologies": ["tech1", "tech2"],
      "link": "https://github.com/username/project",
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Month Year",
      "expiryDate": "Month Year or N/A"
    }
  ],
  "atsKeywords": ["keyword1", "keyword2", "keyword3"],
  "improvementTips": [
    "Specific tip 1",
    "Specific tip 2",
    "Specific tip 3"
  ]
}

Important:
- Make content ATS-optimized with industry keywords
- Use strong action verbs
- Include quantifiable achievements where possible
- Tailor content specifically for ${data.jobRole} role
- Match experience level: ${data.experienceLevel || 'mid'}`;
}

// POST /api/ai/generate
const generateResume = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const {
      name, jobRole, skills, experienceLevel = 'mid',
      education, additionalContext, resumeId,
    } = req.body;

    if (!jobRole || !skills) {
      return res.status(400).json({ success: false, message: 'Job role and skills are required' });
    }

    const cacheKey = createCacheKey(jobRole, skills, experienceLevel);

    // Check exact cache match
    let cached = await queryOne(
      'SELECT * FROM ai_resume_cache WHERE cache_key = ?',
      [cacheKey]
    );

    if (cached) {
      // Update cache usage stats
      await query(
        'UPDATE ai_resume_cache SET use_count = use_count + 1, last_used_at = NOW() WHERE id = ?',
        [cached.id]
      );

      const content = typeof cached.generated_content === 'string'
        ? JSON.parse(cached.generated_content)
        : cached.generated_content;

      // Log history
      const userId = req.user?.role !== 'guest' ? req.user?.id : null;
      await query(
        `INSERT INTO ai_generation_history (user_id, resume_id, cache_id, job_role, skills_input, was_cached, generation_time_ms)
         VALUES (?, (SELECT id FROM resumes WHERE uuid = ? LIMIT 1), ?, ?, ?, 1, ?)`,
        [userId, resumeId || null, cached.id, jobRole, skills, Date.now() - startTime]
      );

      return res.json({
        success: true,
        data: { content, cached: true, generationTime: Date.now() - startTime },
      });
    }

    // Check similarity match (70%+ similar skills for same role)
    const similarCached = await query(
      `SELECT * FROM ai_resume_cache 
       WHERE LOWER(job_role) LIKE LOWER(?) AND experience_level = ?
       ORDER BY use_count DESC LIMIT 5`,
      [`%${jobRole.split(' ')[0]}%`, experienceLevel]
    );

    for (const candidate of similarCached) {
      const similarity = skillsSimilarity(skills, candidate.skills_input || '');
      if (similarity >= 0.7) {
        await query(
          'UPDATE ai_resume_cache SET use_count = use_count + 1, last_used_at = NOW() WHERE id = ?',
          [candidate.id]
        );
        const content = typeof candidate.generated_content === 'string'
          ? JSON.parse(candidate.generated_content)
          : candidate.generated_content;

        return res.json({
          success: true,
          data: { content, cached: true, similarity: Math.round(similarity * 100), generationTime: Date.now() - startTime },
        });
      }
    }

    // Generate new content via AI
    const prompt = buildResumePrompt({ name, jobRole, skills, experienceLevel, education, additionalContext });
    let rawContent;

    try {
      rawContent = await callAI(prompt);
    } catch (aiError) {
      console.error('AI generation failed:', aiError.message);
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please check your API key configuration.',
        error: aiError.message,
      });
    }

    // Parse JSON from AI response
    let parsedContent;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
      }
    }

    // Save to cache
    await query(
      `INSERT INTO ai_resume_cache (cache_key, job_role, skills_input, experience_level, generated_content, model_used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cacheKey, jobRole, skills, experienceLevel, JSON.stringify(parsedContent),
        process.env.AI_PROVIDER === 'openai' ? 'gpt-3.5-turbo' : 'gemini-3.6-flash']
    );

    const userId = req.user?.role !== 'guest' ? req.user?.id : null;
    await query(
      `INSERT INTO ai_generation_history (user_id, job_role, skills_input, was_cached, generation_time_ms)
       VALUES (?, ?, ?, 0, ?)`,
      [userId, jobRole, skills, Date.now() - startTime]
    );

    res.json({
      success: true,
      data: { content: parsedContent, cached: false, generationTime: Date.now() - startTime },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/improve-section
const improveSection = async (req, res, next) => {
  try {
    const { sectionType, content, jobRole } = req.body;

    const prompt = `You are an expert resume writer. Improve the following resume ${sectionType} section for a ${jobRole || 'professional'} role.

Current content: ${JSON.stringify(content)}

Provide improved content that is:
- More impactful with strong action verbs
- ATS-optimized with relevant keywords
- Quantifiable where possible
- Professional and concise

Return ONLY the improved content as JSON matching the same structure. No explanation.`;

    const rawContent = await callAI(prompt);
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let improved;
    try {
      improved = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      improved = match ? JSON.parse(match[0]) : { improved: cleaned };
    }

    res.json({ success: true, data: { improved } });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/ats-score
const calculateAtsScore = async (req, res, next) => {
  try {
    const { resumeContent, jobDescription } = req.body;
    if (!resumeContent || typeof resumeContent !== 'object' || Array.isArray(resumeContent)) {
      return res.status(400).json({ success: false, message: 'Resume content is required for ATS analysis.' });
    }
    if (jobDescription !== undefined && typeof jobDescription !== 'string') {
      return res.status(400).json({ success: false, message: 'Job description must be plain text.' });
    }
    if (JSON.stringify(resumeContent).length > 50000) {
      return res.status(400).json({ success: false, message: 'Resume content is too large to analyze.' });
    }
    if (typeof jobDescription === 'string' && jobDescription.length > 5000) {
      return res.status(400).json({ success: false, message: 'Job description must be under 5,000 characters.' });
    }
    const prompt = `Analyze this resume and provide an ATS compatibility score. Score only the content provided. Do not invent qualifications or suggest adding a keyword unless it genuinely reflects the candidate's experience.

Resume Content: ${JSON.stringify(resumeContent)}
${jobDescription ? `Target Job Description: ${jobDescription}` : ''}

Return JSON with this structure:
{
  "overallScore": 85,
  "breakdown": {
    "keywords": 80,
    "formatting": 90,
    "skills": 85,
    "experience": 80,
    "education": 90
  },
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": [
    "Add more quantifiable achievements",
    "Include relevant certifications"
  ],
  "strengths": ["Strong technical skills", "Clear work history"]
}`;

    const rawContent = await callAI(prompt);
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(502).json({ success: false, message: 'AI returned an invalid ATS analysis. Please try again.' });
      }
      analysis = JSON.parse(match[0]);
    }
    if (!analysis || typeof analysis !== 'object' || !Number.isFinite(Number(analysis.overallScore))) {
      return res.status(502).json({ success: false, message: 'AI returned an incomplete ATS analysis. Please try again.' });
    }
    analysis.overallScore = Math.max(0, Math.min(100, Math.round(Number(analysis.overallScore))));
    if (analysis.breakdown && typeof analysis.breakdown === 'object') {
      Object.keys(analysis.breakdown).forEach(key => {
        const score = Number(analysis.breakdown[key]);
        analysis.breakdown[key] = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
      });
    }
    analysis.suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];
    analysis.missingKeywords = Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [];
    analysis.strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];

    res.json({ success: true, data: { analysis } });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/generate-summary
const generateSummary = async (req, res, next) => {
  try {
    const { name, jobRole, skills, yearsOfExperience } = req.body;

    const prompt = `Write a compelling 3-4 sentence professional summary for a resume.

Name: ${name || 'Professional'}
Target Role: ${jobRole}
Key Skills: ${skills}
Experience: ${yearsOfExperience || 'several'} years

Requirements:
- Start with a strong professional statement (NOT "I am...")
- Include key technical skills
- Mention years of experience
- Add value proposition
- Keep it under 80 words
- ATS-optimized

Return only the summary text, nothing else.`;

    const summary = await callAI(prompt);
    res.json({ success: true, data: { summary: summary.trim() } });
  } catch (error) {
    next(error);
  }
};

const rewriteBullet = async (req, res, next) => {
  try {
    const { bullet, jobRole, jobDescription } = req.body;
    if (typeof bullet !== 'string' || !bullet.trim() || bullet.length > 2000) {
      return res.status(400).json({ success: false, message: 'Enter a bullet point under 2,000 characters.' });
    }
    if (jobDescription !== undefined && typeof jobDescription !== 'string') {
      return res.status(400).json({ success: false, message: 'Job description must be plain text.' });
    }
    if (typeof jobDescription === 'string' && jobDescription.length > 5000) {
      return res.status(400).json({ success: false, message: 'Job description must be under 5,000 characters.' });
    }
    if (jobRole !== undefined && (typeof jobRole !== 'string' || jobRole.length > 120)) {
      return res.status(400).json({ success: false, message: 'Job role must be plain text under 120 characters.' });
    }

    const prompt = `Rewrite this resume bullet for ${jobRole || 'the candidate'}.
${jobDescription ? `Use the job description only to prioritize relevant wording. Job description: ${jobDescription}` : ''}
Original bullet: ${bullet.trim()}

Return one concise bullet sentence, without a bullet character or quotation marks.
Keep every claim, metric, tool, and responsibility grounded in the original bullet. Do not invent numbers, achievements, skills, or experience. If a stronger rewrite would require unsupported details, keep the meaning and improve only clarity and action verbs.`;
    const suggestion = (await callAI(prompt)).trim().replace(/^["'•\-\s]+|["'\s]+$/g, '');
    if (!suggestion) {
      return res.status(503).json({ success: false, message: 'AI did not return a rewrite. Please try again.' });
    }
    res.json({ success: true, data: { suggestion } });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateResume, improveSection, calculateAtsScore, generateSummary, rewriteBullet };
