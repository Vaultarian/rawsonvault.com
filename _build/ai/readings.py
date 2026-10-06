# -*- coding: utf-8 -*-
"""Readings for each AI Literacy page -- THE FILE TO EDIT when a reading changes.

One list per page, keyed by the page's `dir` in manifest.py. build_pages.py and
patch_s4.py render it as the "Readings" block (the .documents component, PDF
icon rows). A page with no entry, or an empty list, gets no Readings block.

Each reading is a dict:
    title   the article's own title
    by      authors / publisher / year, as it should read on the page
    url     a public link to the original               -> LINKED row
    file    a PDF committed under ai/students/<dir>/readings/  -> HOSTED row
    meta    the right-hand pill: "PDF" for hosted, else the source's name
    icon    pdf (default) | youtube | google-docs
    credit  HOSTED only: licence + source, printed in the credit line
    core    True for the lesson's core reading(s): rendered in their own
            highlighted "Core Reading" block above the "Further Readings"

THE COPYRIGHT RULE (rawsonvault AGENTS.md): host a copy ONLY when it is licensed
for redistribution or published free, publicly, for classroom use -- and credit
it. Paywalled, login-only or unclear-provenance material is LINKED to its public
original, never hosted. Check a hosted PDF's last page before adding it.

Source of every entry: the lesson's "Readings" list in
~/vault/01-Teaching/AI Club/Curriculum/Season N - */ (the .docx carries the
hyperlinks the .md conversions lost). Built 2026-10-06.
"""

R = {}

# ---------------------------------------------------------------- Season 1
R["season-1/s1e1-anthropomorphism"] = [
    dict(title="The benefits and dangers of anthropomorphic conversational agents",
         by="Sandra Peter, Kai Riemer &amp; Jevin D. West &middot; PNAS, 2025", core=True,
         url="https://doi.org/10.1073/pnas.2415898122", meta="PNAS"),
    dict(title="The pros and cons of saying &lsquo;thank you&rsquo; and &lsquo;good morning&rsquo; to AI",
         by="Daniel Soufi &middot; El Pa&iacute;s English, 2024",
         url="https://english.elpais.com/technology/2024-04-21/the-pros-and-cons-of-saying-thank-you-and-good-morning-to-ai.html",
         meta="El Pa&iacute;s"),
    dict(title="Anthropomorphization of AI: Opportunities and Risks",
         by="Ameet Deshpande, Tanmay Rajpurohit, Karthik Narasimhan &amp; Ashwin Kalyan &middot; arXiv, 2023",
         url="https://arxiv.org/abs/2305.14784", meta="arXiv"),
    dict(title="Overtrust in AI recommendations about whether or not to kill",
         by="Colin Holbrook, Daniel Holman, Joshua Clingo &amp; Alan R. Wagner &middot; Scientific Reports, 2024",
         file="holbrook-2024-overtrust-in-ai.pdf", meta="PDF",
         credit='Holbrook et al. (2024), <em>Scientific Reports</em> 14, '
                '<a href="https://doi.org/10.1038/s41598-024-69771-z">doi:10.1038/s41598-024-69771-z</a>. '
                '&copy; The Authors, published under '
                '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.'),
    dict(title="Research hotspots and trends of social robot interaction design",
         by="Jianmin Wang, Yongkang Chen, Siguang Huo, Liya Mai &amp; Fusheng Jia &middot; Sensors (MDPI), 2023",
         file="wang-2023-social-robot-interaction-design.pdf", meta="PDF",
         credit='Wang et al. (2023), <em>Sensors</em> 23, 9369, '
                '<a href="https://doi.org/10.3390/s23239369">doi:10.3390/s23239369</a>. '
                '&copy; The Authors, licensee MDPI, published under '
                '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.'),
    dict(title="Engagement with conversational agent&ndash;enabled interventions in cardiometabolic disease self-management",
         by="Nick Kashyap et al. &middot; JMIR mHealth and uHealth, 2025",
         file="kashyap-2025-conversational-agents-health.pdf", meta="PDF",
         credit='Kashyap et al. (2025), <em>JMIR mHealth and uHealth</em> 13, e67913, '
                '<a href="https://doi.org/10.2196/67913">doi:10.2196/67913</a>, first published in JMIR mHealth and uHealth at '
                '<a href="https://mhealth.jmir.org/2025/1/e67913">mhealth.jmir.org/2025/1/e67913</a>. '
                '&copy; The Authors, published under '
                '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.'),
]

R["season-1/s1e2-how-llms-work"] = [
    dict(title="Generative AI exists because of the transformer",
         by="Financial Times, 2023 &middot; interactive explainer", core=True,
         url="https://ig.ft.com/generative-ai/", meta="Financial Times"),
    dict(title="The surprising power of next-word prediction (Large language models explained, part 1)",
         by="Center for Security and Emerging Technology (CSET), Georgetown",
         url="https://cset.georgetown.edu/article/the-surprising-power-of-next-word-prediction-large-language-models-explained-part-1/",
         meta="CSET"),
    dict(title="How developers steer language model outputs (part 2)",
         by="Center for Security and Emerging Technology (CSET), Georgetown",
         url="https://cset.georgetown.edu/article/how-developers-steer-language-model-outputs-large-language-models-explained-part-2/",
         meta="CSET"),
    dict(title="Multimodality, tool use and autonomous agents (part 3)",
         by="Center for Security and Emerging Technology (CSET), Georgetown",
         url="https://cset.georgetown.edu/article/multimodality-tool-use-and-autonomous-agents/",
         meta="CSET"),
]

R["season-1/s1e3-limitations"] = [
    dict(title="LLM hallucinations and failures: lessons from 5 examples",
         by="Evidently AI",
         url="https://www.evidentlyai.com/blog/llm-hallucination-examples", meta="Evidently AI"),
    dict(title="The complete guide to LLM hallucinations: types, examples and how to spot them",
         by="This Week in Science, 2025",
         url="https://thisweekinsciencenews.com/blog/2025/08/21/the-complete-guide-to-llm-hallucinations-types-examples-and-how-to-spot-them/",
         meta="This Week in Science"),
    dict(title="10 biggest limitations of large language models",
         by="ProjectPro",
         url="https://www.projectpro.io/article/llm-limitations/1045", meta="ProjectPro"),
    dict(title="Hallucination vs. confabulation: rethinking AI error terminology",
         by="Integrative Psychology",
         url="https://www.integrative-psych.org/resources/confabulation-not-hallucination-ai-errors",
         meta="Integrative Psych"),
    dict(title="The Underpinnings of AI",
         by="Mr Rawson",
         url="https://docs.google.com/document/d/1YGI9EVc_wuKsPEqwE8DwO8sRK8PBdsdui4ZjKrz4PhQ/edit?usp=sharing",
         meta="Google Doc", icon="google-docs"),
]

R["season-1/s1e4-rules-and-regs"] = [
    dict(title="UK GDPR guidance and resources",
         by="Information Commissioner&rsquo;s Office (ICO)",
         url="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/", meta="ICO"),
    dict(title="Online Safety Act: explainer",
         by="UK Government (DSIT)",
         url="https://www.gov.uk/government/publications/online-safety-act-explainer/online-safety-act-explainer",
         meta="GOV.UK"),
]

# ---------------------------------------------------------------- Season 2
R["season-2/s2e1-prompt-engineering"] = [
    dict(title="Prompt engineering in 2026: optimizing interactions with language models",
         by="Refonte Learning",
         url="https://www.refontelearning.com/blog/prompt-engineering-optimizing-interactions-with-language-models-2026-guide",
         meta="Refonte Learning"),
    dict(title="Instructors as Innovators: a future-focused approach to new AI learning opportunities, with prompts",
         by="Ethan Mollick &amp; Lilach Mollick &middot; Wharton School, 2024",
         url="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4802463", meta="SSRN"),
]

R["season-2/s2e2-set-the-role"] = [
    dict(title="Assigning roles to chatbots", by="Learn Prompting",
         url="https://learnprompting.org/docs/basics/roles", meta="Learn Prompting"),
    dict(title="Prompt engineering best practices", by="DigitalOcean &middot; see &ldquo;Role or persona prompting&rdquo;",
         url="https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices",
         meta="DigitalOcean"),
    dict(title="Role prompting: assigning AI a pedagogical persona", by="EdTechAgent",
         url="https://www.edtechagent.ai/guides/advanced-prompting-teachers/role-prompting-assigning-ai-pedagogical-persona",
         meta="EdTechAgent"),
    dict(title="The Persona Pattern", by="Vanderbilt University on Coursera &middot; short video",
         url="https://www.youtube.com/watch?v=Cd_QBAISaGM", meta="Video", icon="youtube"),
    dict(title="Empowering educators by harnessing generative AI tools: navigating prompt roles",
         by="Jisc National Centre for AI &middot; further reading",
         url="https://nationalcentreforai.jiscinvolve.org/wp/2024/01/11/empowering-educators-by-harnessing-generative-ai-tools-navigating-prompt-roles/",
         meta="Jisc"),
    dict(title="Prompt engineering patterns: roles, constraints and examples",
         by="SixEvent &middot; further reading",
         url="https://sixevent.co.uk/prompt-engineering-patterns-roles-constraints-and-examples",
         meta="SixEvent"),
]

R["season-2/s2e3-metaprompting"] = [
    dict(title="What is meta prompting?", by="IBM",
         url="https://www.ibm.com/think/topics/meta-prompting", meta="IBM"),
    dict(title="What is the flipped interaction pattern?", by="University of Florida Libraries",
         url="https://answers.businesslibrary.uflib.ufl.edu/genai/faq/411750", meta="UF Libraries"),
    dict(title="Flipped interaction pattern", by="UBC Promptathon",
         url="https://blogs.ubc.ca/promptathon/2023/07/30/flipped-interaction-pattern/", meta="UBC"),
]

R["season-2/s2e4-drvr-protocol"] = [
    dict(title="Too long? Must read: Gen Z, AI and the TL;DR culture", by="Markus Brinsa &middot; Medium",
         url="https://medium.com/@markus_brinsa/too-long-must-read-gen-z-ai-and-the-tl-dr-culture-ea10d2e1195d",
         meta="Medium"),
    dict(title="The erosion of deep literacy", by="Adam Garfinkle &middot; National Affairs",
         url="https://nationalaffairs.com/publications/detail/the-erosion-of-deep-literacy",
         meta="National Affairs"),
    dict(title="Ultra-processed minds: the end of deep reading and what it costs us",
         by="Carl Hendrick &middot; Substack",
         url="https://carlhendrick.substack.com/p/ultra-processed-minds-the-end-of", meta="Substack"),
    dict(title="Effective prompts for AI: the essentials",
         by="MIT Sloan Teaching &amp; Learning Technologies",
         url="https://mitsloanedtech.mit.edu/ai/basics/effective-prompts/", meta="MIT Sloan"),
    dict(title="Steel man the exact opposite of your business decision", by="Julie Holmes",
         url="https://julieholmes.com/prompt/steel-man-opposite-business-decision/", meta="Julie Holmes"),
    dict(title="The devil&rsquo;s advocate AI method that prevents disasters", by="GetPrompted",
         url="https://getprompted.ai/devils-advocate-prompting/", meta="GetPrompted"),
]

R["season-2/s2e5-brainstorming"] = [
    dict(title="AI as a thought partner", by="Duke Learning Innovation &amp; Lifetime Education",
         url="https://lile.duke.edu/caradite/ai-student-survey/ai-as-a-thought-partner/", meta="Duke"),
    dict(title="Help students use AI to support their learning", by="University at Albany",
         url="https://www.albany.edu/teaching-and-learning/teaching-resources/help-students-use-ai-support-their-learning",
         meta="UAlbany"),
    dict(title="AI as a thought partner in higher education", by="EDUCAUSE Review, 2025",
         url="https://er.educause.edu/articles/2025/4/ai-as-a-thought-partner-in-higher-education",
         meta="EDUCAUSE"),
    dict(title="AI can help &mdash; and hurt &mdash; student creativity", by="The Conversation",
         url="https://theconversation.com/ai-can-help-and-hurt-student-creativity-220587",
         meta="The Conversation"),
]

R["season-2/s2e6-the-council"] = [
    dict(title="LLM Council", by="Andrej Karpathy &middot; GitHub",
         url="https://github.com/karpathy/llm-council", meta="GitHub"),
    dict(title="LLM Council: Andrej Karpathy&rsquo;s AI for reliable answers", by="Analytics Vidhya, 2025",
         url="https://www.analyticsvidhya.com/blog/2025/12/llm-council-by-andrej-karpathy/",
         meta="Analytics Vidhya"),
    dict(title="Towards understanding sycophancy in language models", by="Anthropic",
         url="https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models", meta="Anthropic"),
]

# ---------------------------------------------------------------- Season 3
_RAG = [
    dict(title="What is RAG? Retrieval-augmented generation explained simply", by="Redis &middot; 5-minute video",
         url="https://www.youtube.com/watch?v=xPMQ2cVbUTI", meta="Video", icon="youtube"),
    dict(title="Retrieval augmented generation for beginners", by="PromptHub",
         url="https://www.prompthub.us/blog/retrieval-augmented-generation-for-beginners", meta="PromptHub"),
    dict(title="RAG for dummies: a beginner&rsquo;s guide to retrieval-augmented generation",
         by="Medium",
         url="https://michielh.medium.com/rag-for-dummies-a-beginners-guide-to-retrieval-augmented-generation-ac3348d31302",
         meta="Medium"),
]
R["season-3/s3e2-rag"] = _RAG
R["stubs/working-rules"] = _RAG          # same source lesson file as S3E2

R["stubs/image-prompt-designer"] = [
    dict(title="Prompt engineering for AI image generation: essential techniques for creative professionals",
         by="Transmedia",
         url="https://www.transmedia.co.uk/article/prompt-engineering-for-ai-image-generation-essential-techniques-for-creative-professionals",
         meta="Transmedia"),
    dict(title="GPT image generation models prompting guide", by="OpenAI Cookbook",
         url="https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide", meta="OpenAI"),
]

# ---------------------------------------------------------------- Season 4
R["season-4/s4e1-post-truth"] = [
    dict(title="Deepfakes and the epistemic backstop",
         by="Regina Rini &middot; Philosophers&rsquo; Imprint 20(24), 2020", core=True,
         url="https://quod.lib.umich.edu/p/phimp/3521354.0020.024/--deepfakes-and-the-epistemic-backstop",
         meta="Philosophers&rsquo; Imprint"),
    dict(title="Chamberfakes: assessing threats posed by generative AI technologies to parliamentary democracy in Scotland",
         by="Ben Collier, Morgan Currie &amp; Benedetta Catanzariti &middot; University of Edinburgh for the Scottish Parliament, 2024", core=True,
         url="https://www.sccjr.ac.uk/publication/chamberfakes-assessing-the-threats-scotland/",
         meta="SCCJR"),
]

R["season-4/s4e2-environmentalist-debate"] = [
    dict(title="The Bottleneck",
         by="E.O. Wilson &middot; Scientific American, 2002", core=True,
         url="https://www.scientificamerican.com/article/the-bottleneck/", meta="Scientific American"),
    dict(title="Energy and AI: executive summary",
         by="International Energy Agency (IEA), 2025",
         url="https://www.iea.org/reports/energy-and-ai/executive-summary", meta="IEA"),
    dict(title="Green and intelligent: the role of AI in the climate transition",
         by="Nicholas Stern, Mattia Romani, Roberta Pierfederici et al. &middot; npj Climate Action, 2025",
         url="https://www.nature.com/articles/s44168-025-00252-3", meta="Nature"),
]
