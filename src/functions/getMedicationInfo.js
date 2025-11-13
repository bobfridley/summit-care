import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { medicationName } = await req.json();

        if (!medicationName) {
            return Response.json({ error: 'Medication name is required' }, { status: 400 });
        }

        const openfdaApiKey = Deno.env.get('OPENFDA_API_KEY');

        // Try to get FDA data
        let fdaData = null;
        try {
            const fdaResponse = await fetch(
                `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(medicationName)}"&limit=1${openfdaApiKey ? `&api_key=${openfdaApiKey}` : ''}`
            );
            if (fdaResponse.ok) {
                const data = await fdaResponse.json();
                if (data.results && data.results.length > 0) {
                    fdaData = data.results[0];
                }
            }
        } catch (error) {
            console.error('FDA API error:', error);
        }

        // Use AI to analyze mountaineering risks
        const prompt = `Analyze the medication "${medicationName}" for high-altitude mountaineering use.

${fdaData ? `FDA Data Available:
- Warnings: ${fdaData.warnings?.[0] || 'N/A'}
- Adverse Reactions: ${fdaData.adverse_reactions?.[0] || 'N/A'}
- Drug Interactions: ${fdaData.drug_interactions?.[0] || 'N/A'}
` : 'No FDA data available - use general medical knowledge.'}

Provide a focused analysis for mountaineers:
1. Altitude-specific risks (hypoxia, dehydration, cold, exertion effects)
2. Risk level: low, moderate, high, or severe
3. Key warnings (2-3 bullet points max)
4. Recommendations for high-altitude use

Be concise, safety-focused, and practical.`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: !fdaData, // Only search web if no FDA data
            response_json_schema: {
                type: "object",
                properties: {
                    risk_level: {
                        type: "string",
                        enum: ["low", "moderate", "high", "severe"]
                    },
                    altitude_effects: {
                        type: "array",
                        items: { type: "string" }
                    },
