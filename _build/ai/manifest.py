# -*- coding: utf-8 -*-
"""Manifest for the AI Literacy Course pages. One row per page, course order."""

SEASONS = {
    1: ("The Foundations", "How AI really works, where it falls short, and how to use it well."),
    2: ("Prompt Engineering", "The way you ask is the answer you get — six patterns, one at a time."),
    3: ("Context Engineering", "Stop writing better questions. Start building what the AI already knows."),
    4: ("Harkness Dialogues", "Sit round one table, argue from evidence, and change your mind in public."),
}

P = []   # episodes, in course order


def ep(**kw):
    P.append(kw)


# ---------------------------------------------------------------- Season 1
ep(dir="season-1/s1e1-anthropomorphism", season=1, epi=1, code="S1E1",
   title="The Anthropomorphism Debate", crumb="Anthropomorphism",
   subtitle="Why we treat AI like a person, and whether we should",
   gem="1jKhl7aHohfikI9i5-paQb6XRSJ7ilFG4",
   question="If a machine sounds like it cares, should that change how much you trust what it says?",
   vocab=[("Anthropomorphism", "Treating something that is not human as though it were, because it behaves in a human-like way."),
          ("Persona", "The character an AI is told to adopt. It shapes tone, vocabulary and how much detail you get."),
          ("Fluency", "How natural and confident language sounds. A separate thing from whether it is correct.")])

ep(dir="season-1/s1e2-how-llms-work", season=1, epi=2, code="S1E2",
   title="How LLMs Work", crumb="How LLMs Work",
   subtitle="A machine that does one thing, billions of times: guess the next word",
   gem="1AvtkjD1dsxxSmY0Ym3Gaw-LzdsnwnS0r",
   question="If a model only ever predicts the next word, where does the meaning come from?",
   vocab=[("Training data", "The enormous body of text a model learned patterns from, long before it met you."),
          ("Token", "The chunk of text a model actually works in — usually a word, sometimes part of one."),
          ("Embedding", "A list of numbers recording where a token sits on the model's internal map of meaning."),
          ("Transformer", "The architecture that lets a model weigh which parts of your input matter most."),
          ("Self-attention", "The step where the model decides which earlier words bear on the word it is about to choose.")])

ep(dir="season-1/s1e3-limitations", season=1, epi=3, code="S1E3",
   title="Limitations of AI", crumb="Limitations",
   subtitle="When a confident answer is confidently wrong",
   gem="1ZDuVNEJRolLKXcPstKxL9CLy2FNAKuxK",
   question="How do you tell a confident answer from a correct one?",
   vocab=[("Hallucination", "An AI output that sounds right and is not — invented rather than retrieved."),
          ("Confabulation", "The word some researchers prefer. An AI has no senses to misread; it fills a gap with plausible detail."),
          ("Bias", "A slant in the training data that tilts the answers a model gives."),
          ("Verification", "Checking a claim against a source you trust, before you rely on it.")])

ep(dir="season-1/s1e4-rules-and-regs", season=1, epi=4, code="S1E4",
   title="Rules and Regs", crumb="Rules and Regs",
   subtitle="Writing the rules we want to live by when we use AI together",
   gem="1MrpIvtuqDkWaFG6a1NsRDopmCs_z7c72",
   question="What rules would make AI a thinking partner for everyone here, rather than a shortcut for anyone?",
   objectives=["I can explain why a group that uses AI together needs shared rules, and say what those rules protect.",
               "I can put the four commitments in the club pledge into my own words.",
               "I can bring a proposed rule to the group and argue for it when we write the Class Constitution."],
   vocab=[("Class Constitution", "The set of rules this club writes for itself about how AI gets used here."),
          ("Personal data", "Anything that identifies a real person — a name, a school, an address, a photograph."),
          ("Attribution", "Saying openly when and how you used AI on a piece of work.")])

# ---------------------------------------------------------------- Season 2
ep(dir="season-2/s2e1-prompt-engineering", season=2, epi=1, code="S2E1",
   title="Prompt Engineering 101", crumb="Prompt Engineering 101",
   subtitle="The way you ask is the answer you get",
   gem="1dPs1JZbNo-jxnpyAyco6dELWCeeFO0_a",
   question="What is the smallest change to a prompt that makes the biggest difference to the answer?",
   vocab=[("Prompt", "Everything you send the model — the question and every instruction wrapped around it."),
          ("Prompt engineering", "Designing that wrapping on purpose, instead of typing the first thing that comes to mind."),
          ("Context", "The background you hand over so the answer fits your situation rather than a generic one."),
          ("Output format", "Telling the model the shape you want back: a table, five bullets, a paragraph, a checklist.")])

ep(dir="season-2/s2e2-set-the-role", season=2, epi=2, code="S2E2",
   title="Set the Role", crumb="Set the Role",
   subtitle="Tell the AI who it is, and everything changes",
   gem="1UM7NnAQxF8-nK5k1MXXGOkhSFAiXW6gO",
   question="Why does telling an AI who it is change the answer more than telling it what to do?",
   vocab=[("Role prompting", "Opening a prompt by naming who the AI is, so tone, vocabulary and depth all shift at once."),
          ("Persona", "The identity you hand it — surgeon, tortoise, detective — and the cluster of patterns that comes with it."),
          ("Register", "How formal or casual language is. A role sets it in one move, without you listing rules.")])

ep(dir="season-2/s2e3-metaprompting", season=2, epi=3, code="S2E3",
   title="MetaPrompting", crumb="MetaPrompting",
   subtitle="Let the AI interview you, then build the prompt from your answers",
   gem="1Cds1mVSdKX0aUwU72eSXy7bL0vjNhQfX",
   question="Who should write the prompt — you, or the AI that is about to answer it?",
   vocab=[("Meta-prompting", "Using AI to build the prompt itself, rather than to write the final answer."),
          ("Flipped Interaction Pattern", "The AI asks the questions first. Your answers become the prompt."),
          ("Deterministic", "Same input, same output, every time. A calculator is deterministic."),
          ("Stochastic", "Randomness is built into how each word is chosen, so the same prompt can answer differently twice.")])

ep(dir="season-2/s2e4-drvr-protocol", season=2, epi=4, code="S2E4",
   title="DRVR Protocol", crumb="DRVR Protocol",
   subtitle="Didn't Read, Various Reasons — what real reading support looks like",
   gem="1_j8yCIxHY9H45u3_FICX-9v_po9vXEht",
   question="What does reading support look like when it is not a summary?",
   objectives=["I can work through a demanding text in layers, instead of replacing it with a summary.",
               "I can separate a claim from the evidence offered for it.",
               "I can name the question a text leaves open."],
   vocab=[("DRVR", "Didn't Read, Various Reasons — the protocol this session runs on."),
          ("Claim", "A statement the text asks you to accept. Evidence is the separate question of why you should."),
          ("Counterargument", "The strongest case against the text's position, stated fairly rather than knocked down.")])

ep(dir="season-2/s2e5-brainstorming", season=2, epi=5, code="S2E5",
   title="Brainstorming", crumb="Brainstorming",
   subtitle="The constraint is where creativity begins",
   gem="1qvtFxaO6VC8FlfK6gUk0yTdWQUnhDBm1",
   question="Does a tighter constraint leave you with fewer ideas, or better ones?",
   vocab=[("Constraint", "A hard limit — a weight, a budget, a deadline — that the design has to live inside."),
          ("Reframe", "Changing the question when the obvious answer hits a wall, rather than pushing harder at it."),
          ("Sycophancy", "An AI's pull toward agreeing with you. Left unchallenged it validates a design instead of testing it.")])

ep(dir="season-2/s2e6-the-council", season=2, epi=6, code="S2E6",
   title="The Council", crumb="The Council",
   subtitle="Five advisors who argue with each other so the blind spots show",
   gem="1dBrhGgM4L9p7IRCxD4Sngs46BC2yJE5O",
   question="If the answer changes when the question changes, which answer was ever true?",
   vocab=[("Framing", "How a question is put. Ask what is good and you get strengths; ask what is wrong and you get faults."),
          ("Sycophancy", "The pull toward telling you what you want to hear — the thing the Council is built to defeat."),
          ("Synthesis", "The Chairman's job: where the five agree, where they clash, and what all of them missed.")])

# ---------------------------------------------------------------- Season 3
ep(dir="season-3/s3e1-context-engineering-101", season=3, epi=1, code="S3E1",
   title="Context Engineering 101", crumb="Context Engineering 101",
   subtitle="Give the AI a map of who you are, and its answers stop being generic",
   gem="1ambGooJH1WbTIQDglStoMqwGwWaHxuI9",
   question="How much does an AI need to know about you before its advice is actually about you?",
   vocab=[("Context engineering", "Organising files and instructions so the AI starts every exchange already knowing how to help you."),
          ("Harness", "The folder of files you build around an AI. Today you make its front door."),
          ("README.md", "By long convention, the file that explains everything else in a folder. Yours explains you."),
          ("Markdown", "Plain text with a few punctuation marks for structure. Every AI reads it, and it will still open in twenty years.")])

ep(dir="season-3/s3e2-rag", season=3, epi=2, code="S3E2",
   title="RAG", crumb="RAG",
   subtitle="Retrieval-Augmented Generation, demonstrated on you",
   gem="1n4vU6eW1-yd-3jlj2lNNHqysFuX9mpG_",
   question="How would you prove an AI is reading your file, rather than remembering something that sounds like it?",
   article="""
            <h2>What this lesson is about</h2>
            <p>RAG stands for Retrieval-Augmented Generation, and it is how an AI answers questions from documents it was never trained on. You ask something, it searches the files it has been given, pulls out the most relevant passage, and writes its answer using that passage alongside what it already knew. Today you take that process apart from the inside, because the Gem you are about to open <em>is</em> a RAG system and it knows it. The demonstration happens to you, live, rather than being described to you.</p>

            <h2>What you'll be able to do</h2>
            <ul>
                <li>I can explain what RAG is, in my own words, to someone who has never heard the term.</li>
                <li>I can tell the difference between a knowledge source, which gets searched when needed, and a system prompt, which is always switched on.</li>
                <li>I can design a question that proves whether retrieval actually happened.</li>
                <li>I can describe at least one way retrieval fails, and say what that failure looks like from the outside.</li>
            </ul>

            <h2>A little background</h2>
            <p>The two halves of the name do the work. <strong>Retrieval</strong> is the search step: your files are cut into passages called chunks, and the ones closest in meaning to your question get pulled out. <strong>Generation</strong> is what happens next, when the model writes an answer with those chunks in front of it. Everything interesting about RAG lives in the seam between the two, because a model that retrieves the wrong chunk will still write a confident answer from it.</p>
            <p>The Gem's corpus is invented on purpose. Nothing in it exists anywhere else, so if it can quote the document back to you, retrieval demonstrably happened — there is nowhere else the answer could have come from. That is the check that confirms the lesson landed, and it is the same check you can run on any RAG system you meet later.</p>
""",
   vocab=[("RAG", "Retrieval-Augmented Generation. The AI searches documents you gave it, then answers using what it found."),
          ("Chunk", "One passage of a document, cut to a size the search step can work with. Retrieval returns chunks, not files."),
          ("Knowledge source", "A file the AI searches when a question calls for it."),
          ("System prompt", "Instructions that are always active, every session, never searched for."),
          ("Retrieval", "The search step. Get this wrong and the model writes a fluent answer from the wrong passage.")])

ep(dir="season-3/s3e3-iterating-system-prompts", season=3, epi=3, code="S3E3",
   title="Iterating System Prompts", crumb="Iterating System Prompts",
   subtitle="Bring something you wrote, and leave with a version 2 that is genuinely better",
   gem="1-feUT8HEOu3tjkla8AinB5cRUOyjahcA",
   question="What is the difference between an agent that is finished and one you have simply stopped improving?",
   article="""
            <h2>What this lesson is about</h2>
            <p>Building something is half the job. The other half is the cycle every developer, designer and engineer lives by: <strong>test → identify → fix → retest</strong>. Today you bring a system prompt you have already written, run it hard enough to find where it gives way, and rewrite it as a version 2. The coach you work with only asks questions. You find the gaps, and you write the new rules in your own words — which is the point, because a rule someone else wrote for you is one you cannot defend.</p>

            <h2>What you'll be able to do</h2>
            <ul>
                <li>I can test my own system prompt and name at least three specific things it does not yet handle.</li>
                <li>I can tell a specific improvement from a vague one — not "more detail" but exactly what is missing.</li>
                <li>I can write a version 2 that addresses the gaps I found, and say what changed and why.</li>
                <li>I can compare v1 and v2 on the same input and judge whether the change actually helped.</li>
            </ul>

            <h2>A little background</h2>
            <p>The hard part is not rewriting. It is finding the gap worth rewriting for. "It could be better" is not a finding; "it never asks what format I want, so it always returns a paragraph when I wanted a list" is. A specific fault names the input that triggers it and the output it produces, which means you can check afterwards whether it is gone.</p>
            <p>So the test that confirms your v2 is honest is simple: run v1 and v2 on the <em>same</em> input, and look at the two results side by side. If you cannot point at what changed, the rewrite was cosmetic. If you can, you have just done the thing this whole season is about — changing what the AI knows before it answers, rather than arguing with the answer afterwards.</p>
""",
   vocab=[("System prompt", "The standing instructions an assistant runs under, active before you type a word."),
          ("Iteration", "One pass round the test-fix-retest loop. Version 2 is the artefact; iterating is the habit."),
          ("Specification", "A description precise enough that you could check whether it was met."),
          ("Regression", "When a fix for one thing quietly breaks another. Testing v1 and v2 on the same input is how you catch it.")])

ep(dir="season-3/s3e4-the-extractor", season=3, epi=4, code="S3E4",
   title="The Extractor", crumb="The Extractor",
   subtitle="Drop in a file, get its whole content back as clean text you can keep",
   gem="1AeMAaopxfpv-bOt4h_gXCxwxZ58O_5bm",
   question="Once a document becomes text you can search, what becomes possible that was not possible before?",
   article="""
            <h2>What this lesson is about</h2>
            <p>A PDF is a picture of a document. A photograph of a worksheet is a picture of a picture of a document. Neither can be searched, quoted, fed to another tool, or pulled into the harness you have been building all season. The Extractor's whole job is to turn any of those back into plain text you can actually use. You give it a file or a link; it gives you clean markdown. That is the entire job, and it does nothing else on purpose.</p>

            <h2>What you'll be able to do</h2>
            <ul>
                <li>I can get the full content out of a PDF, a photograph, a slide deck or a spreadsheet as structured text.</li>
                <li>I can explain why a specialist tool that does one job well beats a general assistant that will attempt anything.</li>
                <li>I can judge an extraction by checking it against the original, rather than by whether it reads well.</li>
                <li>I can save what I extract into my own toolkit so a later session can use it.</li>
            </ul>

            <h2>A little background</h2>
            <p>This episode closes the season's loop. Season 3 has been about building context for an AI to work from — first a file describing you, then rules for an agent, then the retrieval step that searches those files. The Extractor is what fills them. It is the difference between a folder of documents you own and a folder of documents an AI can read.</p>
            <p>Extraction is accuracy work rather than reasoning work, so the way to judge it is not whether the output reads nicely. It is whether the output matches the original. Pick something off the page you can see with your own eyes — a figure in a table, a heading halfway down, the last line — and find it in what came back. If those match, the extraction held.</p>
""",
   vocab=[("Extraction", "Getting the content out of a file in a form you can search, quote and reuse."),
          ("Markdown", "Plain text with light punctuation for structure. Readable by you, by any AI, and by any machine later."),
          ("OCR", "Optical Character Recognition — reading letters out of an image, which is what happens to a photographed page."),
          ("Structure", "Headings, lists and tables. A good extraction keeps them; a poor one flattens everything into prose.")])

# ---------------------------------------------------------------- Season 4
ep(dir="season-4/s4e1-post-truth", season=4, epi=1, code="S4E1",
   title="Post-Truth", crumb="Post-Truth",
   subtitle="When seeing is no longer believing",
   gem="18Jtx_lFXse5svkX3Zsf3f8pQYQVMfD8d", patch=True)

ep(dir="season-4/s4e2-environmentalist-debate", season=4, epi=2, code="S4E2",
   title="The Environmentalist Debate", crumb="The Environmentalist Debate",
   subtitle="The economist, the environmentalist, and the carbon cost of AI",
   gem="1JWRuBPLS_gWYlsn4CIjdBRavoYifGJYS", patch=True)

ep(dir="season-4/s4e3-mobius-mind", season=4, epi=3, code="S4E3",
   title="The Möbius Mind", crumb="The Möbius Mind",
   subtitle="The last session of AI Club is the one with no AI in it",
   gem=None, level0=True,
   question="When the world keeps surprising you, how do you keep your mind open?",
   article="""
            <h2>What this lesson is about</h2>
            <p>No screens today. Paper, scissors, a ruler, two coloured pencils and some tape. You are going to build an object that should not be possible, watch it refuse to do what you predict, and use that to think about how you want to carry on after this course ends. The aim is not the maths trick. The aim is the habit of mind the trick points at.</p>
            <p class="level-0"><strong>AI Collaboration Level 0 — no AI.</strong> Hands and minds only. This is the one episode on the course with no Gem behind it, and that is deliberate.</p>

            <h2>What you'll be able to do</h2>
            <ul>
                <li>I can investigate how many sides a piece of paper has, and what folding and cutting do to that number.</li>
                <li>I can build a Möbius strip, trace it and cut it, and describe what I find.</li>
                <li>I can tell the difference between adding complexity to something and genuinely changing what it is.</li>
                <li>I can make a prediction, test it, and describe how the result compared with what I expected.</li>
                <li>I can describe one way I want to keep my thinking open now that the course is over.</li>
            </ul>

            <h2>A little background</h2>
            <p>Everyone agrees a sheet of paper has two sides. Fold it and you can make more — but unfold it and it drops straight back to two, every time. The complexity sat on the surface and never changed what the paper was. So the question the session turns on is whether anything can be done to a piece of paper that changes how many sides it has for good.</p>
            <p>One half-twist can. August Ferdinand Möbius described the strip in 1858, and Johann Benedict Listing described it independently a few months earlier; it still catches out the people who study it for a living. You will predict what happens when you cut it, and the strip will very likely refuse to give you what you predicted. That refusal is the lesson. The skill that matters over the next ten years is not predicting correctly — it is staying curious and steady when you turn out to be wrong.</p>
""",
   vocab=[("Möbius strip", "A loop with a single half-twist, which turns two surfaces into one continuous side."),
          ("Surface", "A side you could paint without lifting the brush. The whole surprise is how many the strip has."),
          ("Prediction", "What you commit to before you test. Writing it down first is what makes the result mean anything.")])

# ---------------------------------------------------------------- Stubs
ep(dir="stubs/working-rules", season=None, epi=None, code="Stub", stub=True,
   title="Working Rules", crumb="Working Rules",
   subtitle="Three decisions, and you leave with a working-rules file for an agent of your own",
   gem="1F7--qRDf0dhDT8YSlqhC5RLwsjXis23w",
   question="What do you do at least three times a week where you always want help, but never quite get the right kind?",
   article="""
            <h2>What this lesson is about</h2>
            <p>Your context file said who you are. This one says what your agent does. In three decisions — a name, a single clear job, and the rules it never breaks — you produce a file called <code>working-rules.md</code> and a folder for the agent to live in. It is short, and it is meant to be: the value is in choosing a job narrow enough to be done well.</p>

            <h2>What you'll be able to do</h2>
            <ul>
                <li>I can name one job my agent does, narrow enough that I could tell whether it did it well.</li>
                <li>I can write rules my agent always follows, in language specific enough to check.</li>
                <li>I can explain why those rules belong in the system prompt rather than in a knowledge file.</li>
                <li>I can save <code>working-rules.md</code> into my toolkit alongside my context file.</li>
            </ul>

            <h2>A little background</h2>
            <p>The three-times-a-week test is how you pick the job. Something you genuinely do that often is something you will keep using the agent for, and a tool you would actually use beats one that merely sounds impressive. Once you have the job, the rules follow from it.</p>
            <p>The placement matters as much as the wording. A knowledge file gets searched when a question happens to call for it; a system prompt is on from the first word of every session. Rules your agent must never break belong in the second place. The check that you have written a real rule rather than a wish: read it back and ask whether you could tell, from a single reply, if it had been followed.</p>
""",
   vocab=[("working-rules.md", "The instructions file for your agent — who it is, what it does, what it never does."),
          ("Agent", "An assistant set up for one job, rather than a general chatbot asked to do everything."),
          ("System prompt", "Always-on instructions, loaded before you type. The right home for a rule that must always hold.")])

ep(dir="stubs/image-prompt-designer", season=None, epi=None, code="Stub", stub=True,
   title="Image Prompt Designer", crumb="Image Prompt Designer",
   subtitle="Build an image prompt one layer at a time",
   gem="1A4vOgcWIYLx7846EQO_x_ptw3R3RU9RT",
   question="What has to be in a prompt before the picture you get is the picture in your head?",
   article="""
            <h2>What this lesson is about</h2>
            <p>An image model will happily turn a vague prompt into something. The question is whether it turns your prompt into what you meant. This session builds a prompt in layers, deciding one thing at a time, and ends with a positive prompt, a negative prompt, and notes on the platform you are generating with.</p>

            <h2>What you'll be able to do</h2>
            <ul>
                <li>I can say what makes an image prompt specific rather than vague, across six dimensions.</li>
                <li>I can order a prompt so the things that matter most carry the most weight.</li>
                <li>I can write a negative prompt, and explain what it is for.</li>
            </ul>

            <h2>A little background</h2>
            <p>Precision comes from being specific across six dimensions: <strong>subject, style, mood, lighting, composition and medium</strong>. "A person" becomes "a young woman in silver armour"; "cool" becomes "anime concept art"; "dark" becomes "tense and melancholic". Each one narrows the space the model is choosing from.</p>
            <p>Order carries weight of its own. Image generators read a prompt top to bottom and give the most weight to what comes first, so the useful sequence is <strong>subject → setting → style → mood → lighting → composition → medium</strong>. Every prompt also has a second half: the negative prompt, listing what to keep out — blurry, watermark, extra limbs, distorted face, text. Using both gives far more control than a positive prompt alone. The check that your prompt is specific enough is whether someone else, reading it cold, would picture roughly what you pictured.</p>
""",
   sources_html="""
            <div class="sources">
                <h2>Where these ideas come from</h2>
                <p class="trust-note">Every technique on this page came from one of the two sources below. Click through and check anything you are about to rely on.</p>
                <ul>
                    <li><span class="tag">Core</span><a href="https://www.transmedia.co.uk/article/prompt-engineering-for-ai-image-generation-essential-techniques-for-creative-professionals" target="_blank" rel="noopener">Prompt Engineering for AI Image Generation.</a> <em>Transmedia</em>. The six dimensions, and why prompt order changes the result.</li>
                    <li><span class="tag">Explainer</span><a href="https://cookbook.openai.com/examples/gpt_image_prompting_guide" target="_blank" rel="noopener">GPT Image Generation Prompting Guide.</a> <em>OpenAI Cookbook</em>. The ladder approach and iterative refinement.</li>
                </ul>
            </div>
""",
   vocab=[("Positive prompt", "What you want, written in ordered layers from subject outwards."),
          ("Negative prompt", "What to keep out — blurry, watermark, extra limbs, text."),
          ("Composition", "How the shot is framed: wide establishing shot, close crop, centred subject."),
          ("Medium", "What it is meant to look like it was made with — oil paint, digital art, film photography.")])
