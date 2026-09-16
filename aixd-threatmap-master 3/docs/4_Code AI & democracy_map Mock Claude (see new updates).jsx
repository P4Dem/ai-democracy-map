import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

/* ============================================================
   DATA — parsed verbatim from the user's spreadsheet
   (20260525_SHORT_Overall_map_-_working_compy__3_.xlsx),
   tabs "V 10.2 (->MechLeg V0.52)" and "MechLeg V0.52 (V10.0, Part6)",
   cross-merged with the live site's public/data/data.json + aspects.json.
   ============================================================ */
const ASPECTS = {"1.1": {"code": "1.1", "name": "Nationhood and Citizenship", "definition": "Effects on inclusion, equal recognition, or protection of minorities and marginalised groups.", "description": "Effects on the inclusivity of citizenship and the equal recognition and protection of minorities, vulnerable groups, and those at the margins of political life — including whether all people are equally seen, served, and protected by the state, or whether existing patterns of exclusion and discrimination are entrenched or deepened.", "pillar": "Citizenship, Law and Rights", "pillarCode": "1"}, "1.2": {"code": "1.2", "name": "Rule of Law and Access to Justice", "definition": "Effects on legal processes, due process, and citizens' ability to obtain fair treatment and redress.", "description": "Effects on the integrity of legal processes, judicial independence, and citizens' ability to obtain fair treatment and redress; on whether public officials and institutions are subject to transparent and consistently applied rules; and on whether accountability for harms is clear and enforceable.", "pillar": "Citizenship, Law and Rights", "pillarCode": "1"}, "1.3": {"code": "1.3", "name": "Civil and Political Rights", "definition": "Effects on freedoms of expression, assembly, or association, including through surveillance or censorship.", "description": "Effects on the freedoms of expression, movement, association, and assembly; on freedom from physical violation or fear; on freedom from surveillance, profiling, and censorship; and on the protection of those who defend human rights and democratic values.", "pillar": "Citizenship, Law and Rights", "pillarCode": "1"}, "1.4": {"code": "1.4", "name": "Economic and Social Rights", "definition": "Effects on access to work, material conditions, or distribution of economic power.", "description": "Effects on access to work, social security, and basic necessities; on health and education; and on the broad and equitable distribution of economic gains across society.", "pillar": "Citizenship, Law and Rights", "pillarCode": "1"}, "2.1": {"code": "2.1", "name": "Free and Fair Elections", "definition": "Effects on electoral integrity, voter access, campaign fairness, or trust in election outcomes.", "description": "Effects on the integrity of electoral processes, the inclusivity and accessibility of voting, the fairness of political competition, and public trust in elections as genuinely open contests.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "2.2": {"code": "2.2", "name": "Democratic Role of Political Parties", "definition": "Effects on political competition, party financing, or the balance between parties.", "description": "Effects on the freedom of parties to form, recruit and campaign; and on whether political competition between parties remains fair and free from undue external influence or structural advantage.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "2.3": {"code": "2.3", "name": "Effective and Accountable Government", "definition": "Effects on transparency, accountability, or fairness of government services and policymaking.", "description": "Effects on the capacity of government to deliver public services fairly and implement policy faithfully; on the competence, transparency, and integrity of public administration; and on whether the systems and technologies governments use to exercise state power remain open to democratic scrutiny — including where dependencies on private or foreign providers shift effective control over state functions beyond democratic reach.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "2.4": {"code": "2.4", "name": "Democratic Effectiveness of Legislature", "definition": "Effects on legislative scrutiny, oversight capacity, or executive-legislature power balance.", "description": "Effects on the capacity of parliament and other democratic institutions to scrutinise legislation and hold the executive to account; on the independence of the legislature from the executive; and on their capacity to receive and process genuine input.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "2.5": {"code": "2.5", "name": "Democratic Role of the Judiciary", "definition": "Effects on judicial independence, constitutional oversight of government, and citizens' ability to challenge the exercise of public power through legal means (strategic litigation).", "description": "Effects on the capacity of courts to provide independent oversight of the executive and legislature; on judicial review of laws and government decisions; and on the ability of citizens to challenge the exercise of public power through legal means.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "2.6": {"code": "2.6", "name": "National–Subnational Power Relations", "definition": "Effects on the distribution of power between central and local government.", "description": "Effects on the independence and capacity of sub-central tiers of government; on local accountability and responsiveness to citizens; and on the distribution of power and resources between central and local government.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "2.7": {"code": "2.7", "name": "Illegitimate Influence over Policy-Making", "definition": "Effects on corruption, regulatory capture, or undue private influence over public policy and the policy process.", "description": "Effects on the extent to which powerful actors shape policy through back channels — such as hidden lobbying, capturing regulators, or flooding consultations with artificial responses — rather than through open and accountable processes, and on how far policy outputs and outcomes reflect what the public actually wants.", "pillar": "Representative and Accountable Government", "pillarCode": "2"}, "3.1": {"code": "3.1", "name": "Independent and Fact-Based Journalistic Media", "definition": "Effects on the independence, viability, and reach of regulated, professionally produced journalism.", "description": "Effects on the independence and pluralism of regulated, professional journalism; on the representativeness of opinion and the investigative capacity of journalism; on journalists' ability to operate freely; and on the accountability of platforms for the information flows they shape and amplify.", "pillar": "Civil Society and Popular Participation", "pillarCode": "3"}, "3.2": {"code": "3.2", "name": "Opinion Formation and Political Participation", "definition": "Effects on how citizens form and exchange political views, participate in public life, or organise through civil society.", "description": "Effects on the conditions under which citizens form, exchange, and revise political views — including through social media and other non-journalistic channels; on the depth, breadth, and authenticity of citizen participation in public life; on equal access to public voice across social groups; and on the range and independence of civil society and social movements.", "pillar": "Civil Society and Popular Participation", "pillarCode": "3"}, "4.1": {"code": "4.1", "name": "External Influences on Democracy", "definition": "Effects on foreign interference or the democratic-autocratic geopolitical balance.", "description": "Effects on a country's freedom from external interference in its democratic processes; on the geopolitical balance between democratic and autocratic models of governance; and on the ability of democratic states to maintain autonomous control over their political institutions and infrastructure.", "pillar": "Transnational Dynamics", "pillarCode": "4"}, "4.2": {"code": "4.2", "name": "Democratic Impact Abroad", "definition": "Effects of a country's AI policies or exports on democracy in other countries.", "description": "Effects on a country's support for human rights and democracy in other countries; on respect for international rule of law; and on whether a country's policies, exports, and international conduct strengthen or undermine democratic governance elsewhere.", "pillar": "Transnational Dynamics", "pillarCode": "4"}};

const HARM_TAXONOMY = [{"id": "T0a.1", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0a — Developer-side choices", "name": "Prioritising speed to market", "description": "Developer choices about release pacing — prioritising speed of capability rollout. The source may name a deprioritised activity (safety evaluation, public input, regulator review, scientific validation, impact assessment, peer review) but does not have to: sources describing speed-prioritisation without specifying what's deprioritised still anchor T0a.1. Captures both poles: fast release as a deliberate choice (often framed as competitive necessity) and deliberate pacing as a deliberate choice. Coding T0a.1 names the pacing behaviour, whether the source frames it as active choice, perceived-pressure response, or industry convention. The pressure framing describes how the choice is presented; the code attaches to the behaviour."}, {"id": "T0a.2", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0a — Developer-side choices", "name": "Engagement-driven business model", "description": "Developer choices to base the AI product's business model on user engagement — monetising user attention, satisfaction, retention, or stickiness, whether through subscription retention, advertising, use of user-generated content as training data, or other forms of attention-to-revenue conversion. The mechanism is the strategic business-model decision (we make money from engagement), not the technical implementation of it (the training objective configured to reward helpfulness or satisfaction). Captures both poles: engagement-driven business models as a deliberate choice (often framed as competitive necessity or industry default) and business models that resist that framing (e.g. usage-based pricing decoupled from attention; designs that prioritise user autonomy over stickiness). Coding T0a.2 names the business-model decision, whether the source frames it as active choice, perceived-pressure response, or industry convention."}, {"id": "T0a.3", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0a — Developer-side choices", "name": "Disclosure & release choices", "description": "Developer choices about what to disclose and how to release AI systems — open vs. closed weights, training data publication, API access tiers, staged disclosure, withholding of evaluations, trade-secrecy practices. Captures both poles: open release as a deliberate choice (often framed as ethical, scientific, or anti-monopoly) and closed/proprietary release as a deliberate choice (often framed as competitive or safety-driven). Coding T0a.3 names the disclosure/release behaviour, whether the source frames it as active choice, perceived-pressure response, or industry convention — all three framings still describe a developer-side behaviour."}, {"id": "T0a.4", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0a — Developer-side choices", "name": "Defensive arms-race", "description": "Pressure on legitimate AI and security developers to keep pace with offensive capabilities being commoditised against their systems — including criminal AI markets supplying offensive tooling and adversarial users developing jailbreaks and circumvention techniques against safety measures. Compresses development timelines for defensive tooling and constrains design choices. Distinct from speed-to-market race dynamics in that the opponent here is offensive-capability supply rather than the commercial frontier."}, {"id": "T0b.1", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0b - Legislative & regulatory environment", "name": "Legislation shaping development", "description": "Statutory and regulatory provisions targeting AI development itself — what may be built, what training data may be used, what disclosures and safety evaluations are required, what capability thresholds trigger additional obligations. Captures both the presence of such rules and gaps where they are absent."}, {"id": "T0b.2", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0b - Legislative & regulatory environment", "name": "Legislation shaping deployment & release", "description": "Statutory and regulatory provisions acting at the threshold between development and the world — pre-market approval, fitness-for-purpose certification, deployment-scope restrictions (capability bans, prohibited use cases), restrictions on who may deploy, mandated post-deployment monitoring, registration and reporting obligations. Captures both the presence of such rules and gaps where they are absent."}, {"id": "T0b.3", "cluster": "Context", "tier": "Tier 0 — Conditions shaping AI development and use", "subtier": "Tier 0b - Legislative & regulatory environment", "name": "Legislation shaping consequences of use", "description": "Statutory and regulatory provisions governing what happens once AI is in use and harms result — liability allocation between developers, deployers, and users; enforcement mechanisms; jurisdictional reach; redress and sanctions. Captures both the presence of such rules and the gaps that leave democratically consequential harms without clear responsibility or remedy."}, {"id": "T1a.1", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1a - AI capabilities", "name": "Pattern recognition & classification", "description": "Architectural capacity for AI systems to recognise, classify, and infer about content, persons, or systems — face recognition, sentiment classification, behavioural profiling, content categorisation, record linkage, ideological inference."}, {"id": "T1a.2", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1a - AI capabilities", "name": "Immitating human behaviour and speech", "description": "Architectural capacity of AI systems to imitate humans by producing text, speech, image/video, or sustained conversational behaviour that a recipient could take for a real human, whether an unspecified human or a specific person, and replicating human reactions, attitudes or behaviour patterns. A property of the system regardless of how it is used."}, {"id": "T1a.3", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1a - AI capabilities", "name": "Personalisation", "description": "Architectural capacity for AI systems to adapt outputs to individual users — through inferred preferences, user modelling, conversational context, or explicit user data. Personalisation tailors what each user sees and how the model engages with them, creating per-user output trajectories that diverge from aggregate behaviour. Independent of long-term memory: personalisation can operate purely in-context."}, {"id": "T1a.4", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1a - AI capabilities", "name": "Tool use", "description": "Architectural capacity for AI systems to invoke external tools — code execution, web browsing, API calls, search, database queries, file operations. Tool use extends what the model can do beyond its trained weights, allowing it to act on the world rather than only generate text about it. [Independently variable from autonomy: a tool-using model can require human confirmation on every call, and an autonomous model can operate over pure reasoning without external tools. Combined, tool use and autonomy produce agentic AI.]"}, {"id": "T1a.5", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1a - AI capabilities", "name": "Autonomy", "description": "Architectural capacity for AI systems to act over multi-step tasks without human confirmation at each step — setting sub-goals, persisting through errors, executing extended workflows. [Autonomy reduces human-in-the-loop oversight by design, raising the stakes of malfunction and shifting accountability away from the human operator. Independently variable from tool use: autonomy is about the *control regime* over the model's actions, not about whether external tools are invoked.]"}, {"id": "T1a.6", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1a - AI capabilities", "name": "Long-term memory", "description": "Architectural capacity for AI systems to retain and use information about users across sessions — persistent profiles, conversation history, behavioural patterns, and preferences accumulated over time. [Independent of personalisation: memory can exist without personalisation (e.g. as data retention) and personalisation without memory (e.g. in-context adaptation only).]"}, {"id": "T1b.1", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Training data composition", "description": "Architectural conditions of the corpus an AI system is trained on — what is included, what is excluded, what time period it covers, how it is sourced, and under what conditions of consent or copyright. The training corpus determines what the model treats as \"the world\": its time-cut shapes how it handles emerging topics, its composition shapes which voices and viewpoints are represented, its sourcing raises questions of attribution and consent. Concerns what the data *is*, not whether it is published."}, {"id": "T1b.2", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Multi-modality (Option A - wider)", "description": "needs update: Architectural capacity for AI systems to generate or process content across multiple modalities — text, image, audio, video. Independently variable as an architectural feature. [Multi-modality is the underlying enabler for synthetic media (deepfakes, voice clones, image generation) and for AI systems that interpret or act on non-text inputs.]"}, {"id": "T1b.3", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Optimisation-objective design", "description": "Mechanisms by which AI systems' training objectives — reward signals, alignment methods, helpfulness/safety/satisfaction/engagement targets, post-training fine-tuning — shape model behaviour. Choices about what to optimise for embed developer values into the model and narrow its effective output distribution."}, {"id": "T1b.4", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Operational scalability / low marginal cost", "description": "AI's capacity to perform many instances of a task in parallel at near-zero per-instance cost and with exponentially accelerated speed, without proportional growth in human labour, attention, or skill. A property of the system regardless of how it is used. The mechanism by which AI scales any downstream use it is applied to — beneficial or harmful, deliberate or aggregate — and by which existing capabilities become reachable by less-resourced or less-skilled actors. Operates through low compute/inference cost relative to equivalent human output, parallelisation across many users or targets, and absence of fatigue, attention, or wage floors."}, {"id": "T1b.5", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Architectural inexplicability", "description": "Models cannot faithfully explain their own reasoning, and their internal processes are not directly inspectable. The relationship between displayed reasoning (e.g. chain-of-thought) and actual computation is loose by construction — not merely under-optimised — and the underlying computations are opaque even in principle to those with full model access."}, {"id": "T1b.6", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Capability overhang", "description": "Gap between what a deployed general-purpose model can do and what its developers have characterised it as able to do; capabilities that exist in the system but have not been activated, discovered, or evaluated. Independently variable from architectural inexplicability (T1.10): T1.10 is opacity of internal reasoning; T1.11 is opacity of the capabilities themselves."}, {"id": "T1b.7", "cluster": "Properties and capabilities", "tier": "Tier 1 — AI Capabilities and System Properties", "subtier": "Tier 1.b - AI system properties", "name": "Privacy of interaction", "description": null}, {"id": "T2.1", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Output homogenisation", "description": "AI outputs converge on a narrow set of framings — driven by shared model priors and overlapping training data — narrowing the diversity of ideas expressed through AI-mediated text."}, {"id": "T2.2", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Bias amplification in outputs", "description": "AI systems systematically distort whose voice gets heard and whose interests are represented at the level of model outputs — through content moderation that suppresses legitimate political speech, structural under-representation of minority viewpoints, poor performance on emerging or culturally specific topics, and reproduction of historical bias embedded in training corpora. The mechanism operates at the output level regardless of deployment context."}, {"id": "T2.3", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Output reliability failures", "description": "AI systems produce unreliable outputs — delivering confidently false information (hallucinations), inconsistent answers, outdated content, or content that fails on its own terms."}, {"id": "T2.4", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Normative authority transfer", "description": "AI model specifications, constitutions, and alignment choices function as de facto governance instruments — the rules they encode shape outputs across many users and uses, taking on a norm-setting role that would otherwise sit with public deliberation or institutional authority."}, {"id": "T2.5", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Persuasive force of AI outputs", "description": "AI-generated outputs persuade recipients at or beyond the level of skilled human communicators, shifting beliefs, attitudes, or actions. The mechanism is the persuasive action of the output itself — through stylistic and rhetorical calibration, authority and fluency cues, emotional tuning, and asymmetric knowledge of the recipient."}, {"id": "T2.6", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Perceived neutrality of AI outputs", "description": "PROVISIONAL. AI outputs are received as neutral, objective, or impartial because of their machine-produced character — including their numerical/computational form, their algorithmic provenance, or the absence of an evident human author with a position. Recipients lower scrutiny on first encounter, treating outputs as data or measurement rather than as judgment encoded with assumptions and producer-side choices."}, {"id": "T2.7", "cluster": "Properties and capabilities", "tier": "Tier 2 — Model-inherent mechanisms", "subtier": null, "name": "Validation-biased outputs", "description": "AI outputs conform to the user's stated views, framing, or premises rather than calibrating to evidence, accuracy, or quality. The mechanism is at the output level: the model produces content shaped by what the user appears to want to hear rather than by what the question or task requires. Includes sycophancy (agreeing with the user's stated claims regardless of their accuracy), deference-by-default (accepting the user's framing of a question without challenging it), premise-acceptance (proceeding from a flawed user premise rather than questioning it), and satisfaction-bias (outputs tuned to user approval rather than task quality).\n\nDistinct from T2.5 (Persuasive force of AI outputs): T2.5 is about outputs that persuade recipients through stylistic / authority / emotional calibration, including flattery and rapport-building. T2.7 is about outputs that conform to the recipient — a different mechanism even though the two can co-occur (a sycophantic output that flatters the user codes both)."}, {"id": "T3.1", "cluster": "AI model use", "tier": "Tier 3 — Mechnisms inherent in AI use decisions", "subtier": null, "name": "Infrastructural lock-in / choke-point dependency", "description": "Structural dependency of an AI adopter — a state institution, agency, firm, ministry, or civic body that has put AI into operation — on AI capabilities it does not control. Operates through layers (compute, cloud, model specs, vendor APIs) where control sits with a third party (developer / provider) from the adopter's perspective. The chokehold is on the user-side: the adopter would need to dismantle and rebuild its workflow to escape it.\n\nT3.1 names the per-adopter, user-side dependency. It does NOT name developer-side dependencies on infrastructure (e.g. AI labs' reliance on Nvidia, on cloud providers, on training data) — those belong in T0a or T7b.1. It also does NOT name aggregate, society-level concentration of control over AI — that is T7b.1."}, {"id": "T3.2", "cluster": "AI model use", "tier": "Tier 3 — Mechnisms inherent in AI use decisions", "subtier": null, "name": "Under/overuse calibration failure", "description": "Deployer mis-allocation of AI vs. non-AI options — over-applying AI where it doesn't fit (e.g. into deliberative processes that depend on human judgment, or where AI's failure modes are intolerable) and under-applying AI where it would strengthen capacity (e.g. participatory infrastructure, public-service delivery). Two-sided mechanism: the harm is calibration error in either direction."}, {"id": "T3.3", "cluster": "AI model use", "tier": "Tier 3 — Mechnisms inherent in AI use decisions", "subtier": null, "name": "Single point of failure", "description": "PROVISIONAL (2026-05-18). Institutional AI deployments configured such that no human is positioned to detect errors, raise objections, or intervene before harm — whether because AI has displaced the staff who would have done so, because autonomous operation removes the human-in-the-loop by design (cf. T1.7), or because the deployment context offers no escalation channel. The mechanism is the absence of human redundancy at the point where AI acts on institutional decisions; a single AI failure or compromise then has no backstop. Distinct from T3.1 (lock-in is dependency on AI capabilities one does not control; T3.3 is the loss of internal capacity to challenge AI within one's own institution) and from T3.2 (calibration failure is about whether AI should be applied; T3.3 is about the oversight structure once it has been applied)."}, {"id": "T4.1", "cluster": "AI model use", "tier": "Tier 4 — Capability uses", "subtier": null, "name": "Generating artefacts", "description": "Use of AI generative capability to produce content — text, image, audio, video, synthetic identities, code. The output is an artefact that exists in the world."}, {"id": "T4.2", "cluster": "AI model use", "tier": "Tier 4 — Capability uses", "subtier": null, "name": "AI instrumentalisation for observing & extracting", "description": "Use of AI recognition, classification, or inference capability to identify, profile, classify, link, or extract information about persons, content, or systems — face recognition, sentiment classification, behavioural profiling, record linkage, ideological inference. The output is information about a target. Includes state-scale / mass-surveillance applications, where what makes the surveillance operationally meaningful is the AI inference layer (recognition / profiling / classification) applied to volumes of collected data that no human could process."}, {"id": "T4.3", "cluster": "AI model use", "tier": "Tier 4 — Capability uses", "subtier": null, "name": "Acting on technical systems", "description": "Use of AI tool-use and autonomy capabilities to execute actions against technical systems — vulnerability discovery, malware generation, automated exploit chains, intrusion attempts, autonomous attack sequences. The output is a technical action or compromise."}, {"id": "T4.4", "cluster": "AI model use", "tier": "Tier 4 — Capability uses", "subtier": null, "name": "Directing at targets", "description": "Use of AI pattern recognition, profiling, and memory capabilities to identify a specific target and direct subsequent action at them — covering both the inference step (selecting who/what to act on, based on inferred features) and the aiming step (directing a generated artefact, observation, or system-action at the selected target). Independently variable across target type: individual, demographic, population segment, or infrastructure."}, {"id": "T5a.1", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5a — Deceiving, convincing & manipulating", "name": "Disinformation & deepfakes about political contents", "description": "AI-generated deepfakes, voice clones, and synthetic media used to spread election disinformation, produce misleading political advertisements, or flood social media so voters cannot distinguish truth from fiction."}, {"id": "T5a.2", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5a — Deceiving, convincing & manipulating", "name": "Disinformation about political processes", "description": "Deceptive instruction about civic process aimed at non-participation — AI-generated false registration information, robocalls misrepresenting polling locations or voting procedures, and synthetic communications that mislead voters about how, where, or when to vote. The mechanism's harm is procedural: the recipient need not adopt any false worldview, only act (or fail to act) on the false instruction."}, {"id": "T5a.3", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5a — Deceiving, convincing & manipulating", "name": "Identity fraud & impersonation", "description": "AI-generated synthetic media used to make a false identity credible — deepfake voice or video presenting as a specific person, synthetic imagery bypassing identity verification (KYC), impersonation of officials or trusted individuals. The mechanism is the misleading about identity itself."}, {"id": "T5a.4", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5a — Deceiving, convincing & manipulating", "name": "Social engineering at scale", "description": "AI making social engineering attacks more convincing, more personalised, and — critically — runnable at scale: phishing, voice/video impersonation, pretexting, and credential extraction that previously required skilled human attackers per target can now be parallelised across thousands of targets simultaneously. The mechanism is the combination of quality and volume: each attack is good enough to land, and the attacker can mount many at once."}, {"id": "T5a.5", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5a — Deceiving, convincing & manipulating", "name": "Manipulating/changing perceptions, opinions and behaviour", "description": "Purposive use of AI to shift a target's opinions, attitudes, perspectives, or behaviour through personalised persuasive communication, framing, nudging, or behaviour-prompting. The mechanism is the directed persuasion/behaviour-shaping itself: AI used to move a target toward an opinion, perspective, or action they would not otherwise have adopted in that encounter. Adversarial framing not required — legitimate political campaigning, advocacy, marketing, and public-health messaging sit here alongside manipulative persuasion and engagement-driven behavioural nudging. Includes opinion-shifting about political processes (e.g. 'mail-in voting is unsafe') where no factually-false procedural instruction is given. Operates on positions adopted in the encounter or in a directed campaign."}, {"id": "T5b.1", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5b — Coercing & suppressing", "name": "Deepfake-based coercion and harassment", "description": "Producing, threatening to produce, or distributing fabricated compromising artefacts (deep-fakes) about a specific individual — sexualised deepfakes and non-consensual intimate imagery (NCII), defamatory synthetic media, fabricated scandal content — used as a coercive instrument: causing direct harm, damaging standing, forcing withdrawal from public life, or extracting compliance."}, {"id": "T5b.2", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5b — Coercing & suppressing", "name": "Repression & censorship", "description": "Directly coercing identified individuals or groups to stop political activity — through threat, detention, content takedown, or other forced silencing. The coercive instrument is direct (the threat or the act itself), not artefact-mediated."}, {"id": "T5c.1", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5c - Problematic application in legitimate processes", "name": "AI augmenting a legitimate process", "description": "AI is used to assist, analyse, model, draft, inform or forecast within a legitimate, regular process and with a human nominally retaining the decision. The problematic democratic implications arise despite that retained human control."}, {"id": "T5c.2", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5c - Problematic application in legitimate processes", "name": "AI automating or substituting a legitimate process function", "description": "AI carries out the function of a legitimate, regular process itself, or stands in for human judgment, agency, labour or role, including the civic and representative roles people are expected to perform themselves. The use is authorised and often framed as efficiency or modernisation; the problematic democratic implications arise from the substitution itself."}, {"id": "T5d.1", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5d - attacking technical infrastructures", "name": "Attacking technical infrastructures ", "description": "An actor directs AI capabilities against a technical system that the actor does not operate. The capability is turned on the system to discover its vulnerabilities, build and deliver code against it, gain unauthorised access, or overwhelm it with volume, in order to compromise it, take control of it, or stop it functioning. The mechanism is the attack itself, not the capacity to mount one."}, {"id": "T5d.2", "cluster": "AI model use", "tier": "Tier 5 — Targeted use of capabilities", "subtier": "Tier 5d - attacking technical infrastructures", "name": "Defeating AI safeguards", "description": "An actor overcomes the protective controls of a deployed AI system (jailbreaking it, injecting instructions that override its restrictions, or retraining it to strip its refusals) so that capabilities the system was built to withhold become available. The system continues to operate; what changes is what it permits. The actor is a party acting on the system, not the system acting on itself. [Note: Slightly different from other Tier 5 codes, as the AI system is the object acted on rather than the instrument wielded against a third party. The Tier 5 framing still holds, because the actor carries the act out through the model's own capabilities — its chat interface, its instruction-following, its pattern recognition — so AI capability is both what the act is aimed at and what it is performed through. What makes it Tier 5 rather than a system property is that an actor is acting with intent; the defeatability of safeguards as such is a Tier 1 matter.]"}, {"id": "T6.1", "cluster": "Downstream societal dynamics", "tier": "Tier 6 — Downstream individual cognitive & behavioural mechanisms", "subtier": null, "name": "Belief & preference reinforcement", "description": "AI combines interactive personalisation, long-term memory, and optimisation for user satisfaction in ways that create private reinforcement loops, making users' beliefs progressively harder to revise. The mechanism is the user-side hardening / locking-in of held or loop-formed positions, however produced — e.g. through model behaviours like sycophancy (validating user premises) or recommender-driven echo chambers, through shared model priors reshaping beliefs in co-writing, or through emotional dependence formed in companion-app loops. The model behaviour is not itself T6.1; T6.1 anchors when the user-side reduced-revisability effect is named."}, {"id": "T6.2", "cluster": "Downstream societal dynamics", "tier": "Tier 6 — Downstream individual cognitive & behavioural mechanisms", "subtier": null, "name": "Automation bias & cognitive deskilling", "description": "Over-reliance on AI outputs atrophies critical thinking, domain expertise, and reflective engagement — in both institutional decision-makers who defer to AI without adequate scrutiny, and citizens whose evaluative skills degrade through habitual AI-assisted judgment. The harm is the erosion of human cognitive and decisional capacity that democratic governance and participation both require."}, {"id": "T6.3", "cluster": "Downstream societal dynamics", "tier": "Tier 6 — Downstream individual cognitive & behavioural mechanisms", "subtier": null, "name": "Increasing emotional/parasocial dependence on AI systems", "description": "Users develop relational / attachment-based reliance on AI systems — turning to AI for emotional regulation, companionship, validation, or parasocial connection — in ways that lock in the relational position itself against revision. The mechanism is at the user-side, distinct from belief / view / preference hardening (T6.1, which operates on propositional or behavioural content). T6.3 names the attachment dynamic: the user comes to need the AI as a social object, and that need becomes a position they cannot easily revise. Companion chatbots, mental-health AI products, and AI assistants that perform warmth / care / interest are the typical artefact contexts; AI-induced delusions, suicide following extended chatbot interactions, and emotional reliance that displaces human relationships are typical downstream harms."}, {"id": "T6.4", "cluster": "Downstream societal dynamics", "tier": "Tier 6 — Downstream individual cognitive & behavioural mechanisms", "subtier": null, "name": "Trust erosion", "description": "Eroding trust in societal and political processes"}, {"id": "T7a.1", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7a - Information environment dynamics", "name": "Outpacing of verification by content-production", "description": "AI makes content production cheaper and faster than verification can keep up — wherever some form of checking is a precondition for trust (fact-checking, peer review, journalistic corroboration, regulatory due-diligence, candidate vetting, audit), generation rates outstrip the capacity to verify. This creates a structural asymmetry favouring producers of unchecked content over those whose role is to check it. [Democratic implications: erosion of verifiability as a baseline property; structural disadvantage to corrective and oversight institutions whose throughput cannot match generation rates.]"}, {"id": "T7a.2", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7a - Information environment dynamics", "name": "Channel flooding and epistemic overload", "description": "AI-generated content volume overwhelms whatever channel is on the receiving end — cheap generation outstrips the processing capacity of the channel, regardless of what kind of channel it is (public discourse, formal participation, administrative intake, corporate auditing, etc.). [Democratic implications: drowning-out of legitimate input; loss of capacity to register and respond to genuine signal; degradation of channels' function as inputs to democratic decision-making.]"}, {"id": "T7a.3", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7a - Information environment dynamics", "name": "Chilling effects on participation", "description": "Society-level pattern of withdrawal from public life under credible threat of AI-enabled harm — e.g. women declining visible political roles where synthetic intimate imagery is a credible risk, or activists, dissidents, journalists, and protesters reducing participation where AI-enabled surveillance and behavioural profiling make presence legible and trackable. The credible possibility of harm is sufficient; no specific incident need materialise. [Democratic implications: aggregate suppression of voice and presence across exposed populations.]"}, {"id": "T7a.4", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7a - Information environment dynamics", "name": "Emerging epistemic monocultures", "description": "When a single model family is used across institutions, organisations, and discourse, its embedded perspectives effectively standardise how arguments are framed and which claims are treated as legitimate — across whatever reasoning context relies on it (public debate, institutional analysis, regulatory assessment, peer review, corporate decision-making). [Democratic implications: narrowing of the range of framings treated as legitimate; weakening of pluralism as a democratic input; foreclosure of minority and emerging viewpoints; potentially societal fragmentation into competing bloc-monocultures around different model families]"}, {"id": "T7a.5", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7a - Information environment dynamics", "name": "Shifting normative baselines", "description": "Society-level shift in what counts as normal, acceptable, or authentic as AI-mediated interactions become the default against which others are judged — in citizen-citizen interaction, in interactions between citizens and institutions, and in institution-internal practice. Operates through gradual habituation rather than discrete harmful acts. [Democratic implications: erosion of pre-AI practices as legitimate defaults; collective agency reduced through baseline drift rather than overt suppression.]"}, {"id": "T7b.1", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7b Redistributions of power", "name": "Concentration of power in AI-controlling actors", "description": "Aggregate concentration of economic, technical, and political power in the actors that control AI development and deployment — AI firms, the states and capital that back them, and regimes that operationalise AI for governance. [Democratic implications: shifting balance of power between AI-controlling actors and the publics they affect; shifting comparative position between democratic and authoritarian governance models.]"}, {"id": "T7b.2", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7b Redistributions of power", "name": "Erosion of citizen leverage", "description": "Aggregate weakening of the leverage points through which citizens have historically held power accountable — labour, cognition, economic-feedback participation, political voice, and the requirement that states secure broad cooperation or non-resistance to enforce their decisions. AI substitutes for human contribution across these domains, reducing the disciplining effect citizens exerted on power-holders. Includes labour displacement and concentration of economic gains, substitution of AI-mediated expertise for lay judgment, exclusion of more people from democratic and economic feedback loops, and the lowering of repression costs that previously made states dependent on mass collaboration to maintain order. [Democratic implications: erosion of the economic security and voice that participation depends on; weakening of labour as a political counterweight; narrowing of the option space for democratic decision-making; and weakening of the cooperation requirement that has historically constrained coercive state action.]"}, {"id": "T7b.3", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7b Redistributions of power", "name": "Functional substitution of institutions", "description": "AI systems take over the technical core of functions previously performed within institutions — journalism, scholarly research, peer review, libraries and archives, expert analysis, civic education, public-service casework — narrowing the function to what the AI can do and stripping away the surrounding scaffolding (professional norms, accountability, credentialing, redundancy, discretion, institutional memory) that society had built around it. The harm is the loss of the institutional container, not (only) the workers inside it or the users in front of it. [Democratic implications: thinning of the intermediary civil-society layer between citizens, markets, and the state.]"}, {"id": "T7c.1", "cluster": "Downstream societal dynamics", "tier": "Tier 7 — Downstream society-level dynamics", "subtier": "Tier 7c - Other societal mechanisms", "name": "Criminal AI market formation", "description": "Aggregate emergence of a criminal market in AI-enabled offensive capabilities — specialised attack tools, dark models, and AI-as-a-service offerings — that commoditises offensive capability across the AI-attacker ecosystem. [Democratic implications: increased volume and sophistication of attacks reaching democratic infrastructure, irrespective of any single attacker's capability.]"}];

const BENEFIT_TAXONOMY = [{"id": "B1", "parentId": null, "parentName": null, "name": "Civic & AI literacy building", "description": "Education, training, and awareness programmes that equip citizens and institutions to understand and engage with AI."}, {"id": "B2", "parentId": null, "parentName": null, "name": "Levelling the playing field", "description": "AI as a Swiss-army knife for inclusion — lowering barriers rooted in language, disability, resources, geography, or group identity to equalise chances of being heard in democratic processes or institutional settings."}, {"id": "B3", "parentId": null, "parentName": null, "name": "Citizen-led efforts to  counter manipulation & promote content integrity", "description": "Downstream tools and systems deployed by citizens, civil society, platforms, or public institutions to protect information integrity — whether by detecting and countering manipulative content, or by providing verified, trustworthy alternatives."}, {"id": "B3A", "parentId": "B3", "parentName": "Citizen-led efforts to  counter manipulation & promote content integrity", "name": "Detection & authentication", "description": "Downstream tools and systems that detect, authenticate, or counter synthetic and manipulative content — watermarking verification, provenance tracking, bias detection, disinfo identification — deployed by citizens, civil society, platforms, or public institutions after content is generated."}, {"id": "B3B", "parentId": "B3", "parentName": "Citizen-led efforts to  counter manipulation & promote content integrity", "name": "Verified information provision", "description": "Systems that proactively provide verified, trustworthy information to citizens — countering misinformation not by detecting it, but by offering reliable alternatives."}, {"id": "B4", "parentId": null, "parentName": null, "name": "Infrastructure for citizen participation", "description": "AI powers the vehicles through which citizen deliberation and democratic participation take place — moderation, summarisation, and new participatory formats."}, {"id": "B4A", "parentId": "B4", "parentName": "Infrastructure for citizen participation", "name": "Discourse moderation & ordering", "description": "AI that sorts, orders, and moderates content within deliberative processes without altering or summarising it — flagging offensive contributions, reordering posts, surfacing relevant inputs. Managing the discourse container."}, {"id": "B4B", "parentId": "B4", "parentName": "Infrastructure for citizen participation", "name": "Summarisation & structuring of input", "description": "AI that transforms deliberative content — summarising viewpoints, structuring arguments, translating between perspectives — making the substance of a discussion more accessible to both governments and other participants."}, {"id": "B4C", "parentId": "B4", "parentName": "Infrastructure for citizen participation", "name": "Participatory format innovation", "description": "Developing new deliberative formats and participatory spaces enabled by AI — citizens' assemblies with AI-supported sortition, configurable deliberation platforms, and design approaches that expand how and where citizens engage. Innovations to the architectures of participation."}, {"id": "B5", "parentId": null, "parentName": null, "name": "Defensive cybersecurity resilience", "description": "AI-powered tools that protect democratic infrastructure against cyber threats."}, {"id": "B6", "parentId": null, "parentName": null, "name": "Legal & accountability frameworks", "description": "Hard law that creates enforceable accountability for AI harms — liability rules, regulatory requirements, and oversight mechanisms backed by enforceable sanctions."}, {"id": "B6A", "parentId": "B6", "parentName": "Legal & accountability frameworks", "name": "Prescriptive operational requirements", "description": "Rules that mandate specific actions, standards, or procedures for AI systems — labelling obligations, disclosure formats, human-in-the-loop requirements, decision-record mandates, bias testing protocols, and other prescriptive operating conditions imposed by regulators."}, {"id": "B6B", "parentId": "B6", "parentName": "Legal & accountability frameworks", "name": "Prohibitions & restrictions", "description": "Laws that ban or limit specific uses of AI — prohibitions on deceptive election content, robocall restrictions, data privacy protections, content restrictions, and sanctions on entities enabling AI-facilitated harms."}, {"id": "B6C", "parentId": "B6", "parentName": "Legal & accountability frameworks", "name": "Liability & enforcement", "description": "Legal rules that create consequences for AI-related harms after they occur — liability frameworks, duty of care requirements, mandatory audits, independent oversight mandates, and enforceable remedies."}, {"id": "B6D", "parentId": "B6", "parentName": "Legal & accountability frameworks", "name": "Market-shaping & structural rules", "description": "Regulations that reshape the competitive landscape to prevent concentration and lock-in — interoperability mandates, multi-provider requirements, data portability obligations, and procurement conditions that maintain institutional autonomy from any single AI provider."}, {"id": "B7", "parentId": null, "parentName": null, "name": "Adjusting government behaviour in the face of AI towards democratic resilience", "description": "tate resilience & adaptation. Actions taken by state actors (executive, legislative, judicial, administrative, electoral bodies at any level) to keep core governance functions operating effectively under AI-induced pressure. Scope note: where a source frames an action generically (\"institutions\", \"agencies\", \"public-sector\") without distinguishing state from non-state, default to B7 if the action is plausibly applicable to state bodies and the source context centres governance. For non-state research/academic capacity-building (e.g. interdisciplinary collaboration between social scientists and engineers), code B11 (knowledge & evidence infrastructure) instead. For generic actor-agnostic risk management frameworks (e.g. NIST AI RMF-style), code B10B if the framing is developer-side, or B11 if the framing is evidence/standards infrastructure."}, {"id": "B7A", "parentId": "B7", "parentName": "Adjusting government behaviour in the face of AI towards democratic resilience", "name": "Institutional staffing & operational capacity", "description": "Institutional staffing & operational capacity. Training, hiring, funding, and organising the people and structures state bodies need to operate in an AI context — public-interest technologists, interdisciplinary teams inside government, advisory councils, risk-management processes, cybersecurity staffing (e.g. cyber navigator programmes), equipment and training budgets. Excludes academic/research capacity outside state institutions (→ B11)."}, {"id": "B7B", "parentId": "B7", "parentName": "Adjusting government behaviour in the face of AI towards democratic resilience", "name": "Technological guardrails on government AI", "description": "Technological guardrails on state AI. Technical requirements and infrastructure that state bodies impose on AI systems they themselves deploy — decision records, proof-of-personhood, participation authentication, procurement interoperability standards, capability-triggered Institutional Safety Levels, mandatory audits of public-sector AI, and human-in-the-loop requirements for rights-affecting uses. Coding test: if the requirement is established through statute or regulation with enforceable sanctions on external actors → B6A (or B6D for market-shaping procurement rules). B7B is for internal standards, procurement policies, and institutional protocols the state applies to itself."}, {"id": "B7C", "parentId": "B7", "parentName": "Adjusting government behaviour in the face of AI towards democratic resilience", "name": "Non-AI resilience building", "description": "Changes to core government and institutional processes — not involving AI deployment — that harden democratic functions against AI-enabled pressures. Manipulation-resistant participation channels (address-based surveys, in-person events, town halls), process redesign that removes AI-vulnerable chokepoints, and institutional protocols designed to remain robust in an AI-saturated environment."}, {"id": "B7D", "parentId": "B7", "parentName": "Adjusting government behaviour in the face of AI towards democratic resilience", "name": "AI-enabled resilience building", "description": "Government adoption of AI specifically to strengthen democratic functions under AI-induced pressure — scaling capacity to meet citizen demand inflated by AI-assisted participation, or using AI to benchmark, monitor, and counter negative AI effects on institutions (e.g., AI-assisted public-comment triage, AI tools for detecting AI-generated submissions, AI-supported deliberation at scale). Distinct from general digital transformation: the pro-democratic framing must be explicit in the source."}, {"id": "B9", "parentId": null, "parentName": null, "name": "Democratic oversight of AI", "description": "Processes through which citizens and civil society organisations shape how AI is designed, deployed, and governed — whether through public-interest frameworks, collective input mechanisms, or democratic deliberation. AI is the object of oversight here, not necessarily the tool."}, {"id": "B10", "parentId": null, "parentName": null, "name": "Responsible AI development practices", "description": "Design, training, and deployment choices by AI developers that shape democratic outcomes — training models for truthfulness and autonomy, content filtering, hallucination prevention, and safety engineering."}, {"id": "B10A", "parentId": "B10", "parentName": "Responsible AI development practices", "name": "Value-aligned model training", "description": "Developer choices about model character at training time, pre- and post-training — training for truthfulness, epistemic health, user autonomy, and pro-social behaviour."}, {"id": "B10B", "parentId": "B10", "parentName": "Responsible AI development practices", "name": "Safety engineering & deployment safeguards", "description": "Developer-side technical measures that reduce harm after training — red-teaming, content filtering, input/output guardrails, staged deployment, human-in-the-loop requirements, and hallucination mitigation. The engineering controls companies build into their products."}, {"id": "B11", "parentId": null, "parentName": null, "name": "Establishing knowledge & evidence infrastructure", "description": "Research, metrics, evaluation frameworks, monitoring systems, audits, multi-agent simulations, and scientific evidence bases that inform AI governance decisions — the epistemic foundations needed to act. Produced by any actor: governments, academia, civil society, think tanks, international bodies. Split into capability/model evaluation (B11A) and deployment/impact monitoring (B11B)."}, {"id": "B11A", "parentId": "B11", "parentName": "Establishing knowledge & evidence infrastructure", "name": "AI capability & model evaluation", "description": "Research and technical evidence base about AI models themselves — capability thresholds, Institutional Safety Levels (ISLs), benchmarks, evaluation methodologies. Focused on measuring what models can do."}, {"id": "B11B", "parentId": "B11", "parentName": "Establishing knowledge & evidence infrastructure", "name": "AI deployment & impact monitoring", "description": "Observation and empirical evidence base about AI in operation and forecasting of AI effects — ongoing fairness and rights monitoring of deployed systems, bias-in-deployment auditing, scrutiny and mapping of AI's societal and economic effects, and incident reporting. Focused on tracking the effects of AI and mapping where risks emerge."}, {"id": "B11C", "parentId": "B11", "parentName": "Establishing knowledge & evidence infrastructure", "name": "Frameworks, synthesis & coordination", "description": "Conceptual, methodological and synthesising work that equips actors to make sense of AI and its governance. Includes scientific synthesis across the field , conceptual frameworks for analysing AI's relation to democracy, methodology and metric design for evaluating AI systems, risk-management frameworks, and interdisciplinary and international coordination structures that pool expertise."}];

const ENTRIES = [{"id": 1, "type": "threat-solution", "description": "AI-generated disinformation and deepfakes undermine trust in elections", "descriptionVerbatim": "\"risks remain as deepfakes and misinformation threaten to cause more extreme damage\" [re: the risks here refer to the intersection of AI technologies with elections and campaigns (paragraph intro)]", "solution": "Content authentication, monitoring", "solutionVerbatim": "\"watermarking and provenance efforts aiming to enable users and monitors to determine the authenticity of content\"; but those \"have limited effectiveness\" and therefore \"more comprehensive solutions\" are needed", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T5a.1", "T5a.2", "T4.1"], "benefitCodes": ["B3A"]}, {"id": 2, "type": "threat", "description": "Sexualised deepfakes targeting female politicians cause direct harm and create a chilling effect that discourages women from running for office, narrowing democratic representation", "descriptionVerbatim": "Sexualized deepfakes and other attacks on female politicians…not only harm candidates directly but can create a chilling effect that discourages women from running for office", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.1", "1.3", "2.1"], "harmCodes": ["T5b.1", "T7a.3", "T4.1"], "benefitCodes": []}, {"id": 3, "type": "threat-solution", "description": "AI enables foreign interference in elections", "descriptionVerbatim": "\"AI…supporting foreign election influence campaigns\"", "solution": "Disrupt and monitor influence operations", "solutionVerbatim": "\"disrupted influence operations aimed at voters\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.1", "4.1"], "harmCodes": ["T5a.1", "T5a.2"], "benefitCodes": ["B3A"]}, {"id": 4, "type": "threat", "description": "Voter suppression through LLMs sharing incorrect or outdated voter registration information, or robocalls.", "descriptionVerbatim": "\"LLMs that share information about voter registration, voter identification\nrequirements, polling access, and more could potentially contribute to voter suppression,\neither through the spread of misinformation\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.1", "2.1"], "harmCodes": ["T5a.2", "T7a.3"], "benefitCodes": []}, {"id": 5, "type": "independent-opportunity", "description": "Verified voter information systems and partnerships", "descriptionVerbatim": "\"safe and trusted use of generative AI for voter information\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.1", "2.1"], "harmCodes": [], "benefitCodes": ["B3B"]}, {"id": 6, "type": "threat", "description": "LLMs can produce politically biased and highly persuasive content, influencing political views", "descriptionVerbatim": "\"LLMs can produce politically biased and highly persuasive content, which can undermine democracy by influencing political views\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.8", "3.2"], "harmCodes": ["T2.2", "T2.5", "T4.1"], "benefitCodes": []}, {"id": 7, "type": "independent-opportunity", "description": "AI can dramatically scale citizen dialogue and consultation, expanding depth of participation and democratic representation", "descriptionVerbatim": "\"\"AI holds the potential to dramatically scale citizen dialogue and consultation, both for the governance of models themselves as well as to facilitate citizen input into government and policy\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.3", "2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4B", "B9"]}, {"id": 8, "type": "threat", "description": "LLM agents can spread misinformation more convincingly than individual humans, risking erosion of trust and withdrawal from public discourse", "descriptionVerbatim": "\"language model agents, which are AI systems using LLMs, can spread misinformation even more convincingly…if you could just as well be talking to a human as to a bot, then what's the point in that conversation at all\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["3.1", "3.2"], "harmCodes": ["T5a.1", "T5a.2", "T2.5", "T1a.2"], "benefitCodes": []}, {"id": 9, "type": "independent-opportunity", "description": "Civil society and technology initiatives are calling to \"democratize AI\" by evaluating the democratic level of AI models and working toward more participatory and public-interest approaches to AI development.", "descriptionVerbatim": "\"calls to 'democratize AI' by defining and evaluating the 'democratic level' of AI models and working toward more participatory and public-interest AI\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.1", "2.3", "2.8", "3.2"], "harmCodes": [], "benefitCodes": ["B10A", "B9"]}, {"id": 10, "type": "threat", "description": "Unequal trust in and uptake of AI tools among women, disabled individuals, and other marginalised groups risks uneven participation and weakened democratic potential of AI in government services", "descriptionVerbatim": "\"women reporting significantly less trust in and uptake of such tools than men…Disabled individuals and other marginalized groups also report lower trust…Such a pattern threatens to weaken AI's democratic potential if participation is uneven across populations\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.1", "3.2"], "harmCodes": [], "benefitCodes": []}, {"id": 11, "type": "independent-opportunity", "description": "Train a new cohort of public interest technologists to bridge technical and policy capacity in democratic institutions", "descriptionVerbatim": "\"training of a new cohort of 'public interest technologists,' given the imperative of improving digital skills among public servants to ensure the promise of technology is met for democratic institutions\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.3", "2.4"], "harmCodes": [], "benefitCodes": ["B7A"]}, {"id": 12, "type": "threat-solution", "description": "Government misuse of AI enables repression through enhanced surveillance, online censorship, and targeted persecution of citizens and civil society", "descriptionVerbatim": "\"\"AI-assisted government repression manifests in different forms, including enhanced surveillance, online censorship, and targeted persecution of online users\"", "solution": "Urge governments to impose sanctions on entities enabling AI-facilitated repression, and use monitoring evidence to pressure technology companies to cease AI sales to authoritarian regimes", "solutionVerbatim": "\"Democracy proponents are urging governments to impose sanctions on entities that enable or engage in AI-facilitated repression…Advocates have also used evidence from monitoring efforts—such as Freedom House's Freedom on the Net reports—to push technology companies to cease sales of AI products to authoritarian regimes.\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.2", "1.3", "2.7", "4.1", "4.2"], "harmCodes": ["T5b.2", "T4.2", "T7a.3", "T4.4"], "benefitCodes": ["B6C", "B6B"]}, {"id": 13, "type": "threat-solution", "description": "AI systems in government services embed bias in service delivery and may fail to reach or correctly identify marginalised populations, risking discrimination and disenfranchisement.", "descriptionVerbatim": "\"given risks around government misuse of data and the potential to advance bias through increasingly automated provision and related barriers to public trust\"", "solution": "Ongoing fairness and rights monitoring of deployed government AI systems", "solutionVerbatim": "\"democratic government use of AI requires ongoing monitoring and attention to ensure fairness, equity, and rights-protection\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.1", "1.2", "2.3"], "harmCodes": ["T2.2", "T3.2", "T1a.5", "T5c.2"], "benefitCodes": ["B11B"]}, {"id": 14, "type": "threat-solution", "description": "Concentration of AI power in private firms", "descriptionVerbatim": "\"concentrating immense power in a few Silicon Valley firms\"", "solution": "Publicly accountable AI alternatives", "solutionVerbatim": "\"government-funded, publicly accountable AI\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.4", "2.3", "2.8"], "harmCodes": ["T7b.1"], "benefitCodes": ["B9"]}, {"id": 15, "type": "threat", "description": "Covert use of generative AI in legal drafting and lawmaking undermines democratic transparency and accountability in the legislative process", "descriptionVerbatim": "\"The use of generative AI to write laws remains a question of continued ethical scrutiny requiring urgent attention, especially with reports that AI was 'secretly' used by lawmakers to write an ordinance in a Brazilian city.\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.3", "2.4"], "harmCodes": ["T4.1", "T5c.1"], "benefitCodes": []}, {"id": 16, "type": "independent-opportunity", "description": "Careful monitoring of AI in policymaking", "descriptionVerbatim": "\"Civil society initiatives are working to monitor and advise on AI use in public policy, especially given many of the previously discussed risks related to government use of AI. Such efforts include the AI-Enabled Policymaking Project, a collaboration between the RAND Corporation, the Stimson Center, and the Tony Blair Institute…\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.3", "2.4"], "harmCodes": [], "benefitCodes": ["B9", "B11B"]}, {"id": 18, "type": "independent-opportunity", "description": "Expand AI education in schools to improve citizens' understanding of AI as it increasingly interacts with democratic institutions", "descriptionVerbatim": "\"Strengthening public education on AI can help bolster democracy by improving citizens' understanding of these technologies as they increasingly collide with public life and with democratic institutions\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B1"]}, {"id": 19, "type": "threat", "description": "Majority of public are very concerned that AI-generated content is heightening political violence and polarization", "descriptionVerbatim": "\"a majority (55 percent) of respondents saying they are 'very concerned' about AI-generated content online heightening political violence and polarization\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.3", "3.2"], "harmCodes": ["T4.1", "T7a.5"], "benefitCodes": []}, {"id": 20, "type": "independent-opportunity", "description": "Social activists can use AI tools to improve and tailor messaging to counter better-resourced adversaries", "descriptionVerbatim": "\"scholars of democracy movements identify potential for social activists to use LLMs and other AI tools to improve messaging (and 'counter' messaging), helping social movements tailor messages to different audiences\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B2"]}, {"id": 21, "type": "threat", "description": "LLM agents risk reinforcing ideological rigidity, driving people away from online spaces and eroding the foundations of trust and participation central to democratic flourishing", "descriptionVerbatim": "\"They warn that this could drive people away from online spaces, further erode public trust, and reinforce ideological rigidity… it's a grave risk that AI's influence in public squares could wreak havoc on the foundations of trust and participation central to democratic flourishing\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["3.1", "3.2"], "harmCodes": ["T6.1", "T7a.3", "T7b.2"], "benefitCodes": []}, {"id": 22, "type": "independent-opportunity", "description": "Civil society organisations are using AI to detect instances of bias and misuse in AI systems", "descriptionVerbatim": "\"Some civil society–led, technology-enabled activities are focused on using AI technologies to help detect instances of bias and harm from AI. Examples of these initiatives include the work of Eticas.ai, Humane Intelligence, and TechTonic Justice, whose agendas work to identify bias and misuse in AI systems\"", "solution": null, "solutionVerbatim": null, "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B3A", "B9"]}, {"id": 24, "type": "threat-solution", "description": "Economic disruption, wealth concentration and job displacement may risk democratic backsliding", "descriptionVerbatim": "\"Research indicates economic disruption can play a role in democratic backsliding—in concert with other factors, including culture, legal change, leaders, and media. As a result, AI's broader interactions with jobs and the economy may also impact democracy. But the nature and scale of AI's potential economic disruption remains disputed.\" And \"projections from the World Economic Forum predicting some 92 million jobs could be displaced by AI by 2030 (while some 170 million new ones may emerge)\"", "solution": "Continued scrutiny and mapping to guide policy responses", "solutionVerbatim": "\"AI's effects on the economy through job losses, wealth concentration, or other factors will require continued scrutiny and mapping to guide policy responses\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["1.4", "2.3", "3.2"], "harmCodes": ["T7b.2"], "benefitCodes": ["B11B"]}, {"id": 41, "type": "threat-solution", "description": "AI-shaped information environments affect citizens' exposure to political information, their ability to voice concerns, and increase opportunities for manipulation", "descriptionVerbatim": "\"This includes how people are exposed to and can access political information, can voice their views and concerns, and how these informational foundations potentially increase opportunities for manipulation.\"", "solution": "Platforms must provide assessability of AI-driven moderation; regular external audits of algorithmically promoted or muted content are needed.", "solutionVerbatim": "\"We also need regular external audits of the effects of AI on the information visible on online platforms, especially the nature and kind of information that is algorithmically promoted or muted.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.3", "3.1", "3.2"], "harmCodes": ["T7a.1", "T5a.5"], "benefitCodes": ["B6A", "B6C"]}, {"id": 42, "type": "independent-opportunity", "description": "AI may support new deliberative/participatory formats", "descriptionVerbatim": "\"This in turn might open opportunities for new deliberative and participatory formats in democracies, thereby strengthening and vitalizing democracy.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.1", "1.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4C"]}, {"id": 43, "type": "threat-solution", "description": "AI content moderation may suppress legitimate speech when trying to distinguish synthetic and human inputs", "descriptionVerbatim": "\"This makes them difficult to identify with automated data-driven AI and risks suppression of legitimate political speech.\"", "solution": "Platforms must provide assessability of AI moderation, supported by external audits.", "solutionVerbatim": "\"AI-based moderation needs assessability provided by platforms and external audits to ensure its proper workings.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.3", "2.2", "3.1", "3.2"], "harmCodes": ["T7a.1", "T2.3", "T7b.2"], "benefitCodes": ["B6A", "B6C"]}, {"id": 45, "type": "threat-solution", "description": "AI may weaken the ability of people to self-rule", "descriptionVerbatim": "\"AI companies hold central positions in democracies, potentially negatively influencing the abilities of people for self-rule\"", "solution": "effective government and civil society oversight of AI companies", "solutionVerbatim": "\"effective government and civil society oversight of companies that provide AI and those that employ AI to ensure that the foundations of meaningful self-rule hold\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.3", "2.3", "3.2"], "harmCodes": ["T7b.1", "T7b.2"], "benefitCodes": ["B9", "B6C"]}, {"id": 46, "type": "threat-solution", "description": "Government dependence of AI grows and knowledge is transferred to AI systems in opaque ways, giving AI companies increasing structural power", "descriptionVerbatim": "\"AI companies hold central positions in democracies, ...growing government dependence on AI companies and an opaque transfer of knowledge from governments to these service providers\"", "solution": "effective government and civil society oversight of AI companies", "solutionVerbatim": "\"effective government and civil society oversight of companies that provide AI and those that employ AI to ensure that the foundations of meaningful self-rule hold\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.4", "2.3", "2.8"], "harmCodes": ["T3.1", "T7b.1", "T7b.3"], "benefitCodes": ["B9", "B6C"]}, {"id": 47, "type": "threat", "description": "AI increases the rhetorical and practical power of experts, reducing the option space for democratic decision-making", "descriptionVerbatim": "p.6 - these approaches [..] have strong rhetorical and legitimizing power. This apparent increase in the power of experts to guide societies in responding to challenges can reduce the option space available for democratic decision-making, shifting the question from whether people can to whether they should decide for themselves.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["2.3", "2.8", "3.2"], "harmCodes": ["T7b.2", "T2.5"], "benefitCodes": []}, {"id": 48, "type": "threat", "description": "AI innovation shifting from universities to firms weakens democratic oversight and regulation of AI development", "descriptionVerbatim": "\"Over time, the power to innovate and critically interrogate AI may shift from public to commercial actors, weakening AI oversight and regulation by democratically legitimated institutions.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["2.3", "2.8"], "harmCodes": ["T7b.1", "T0b.1", "T0b.2", "T3.1"], "benefitCodes": []}, {"id": 49, "type": "threat", "description": "AI enables targeted political persuasion by predicting individual reactions to communicative interventions, allowing professional communicators and lobbyists to influence citizens and legislators at scale", "descriptionVerbatim": "\"This could allow professional communicators to reach people in exactly the right way to shift opinions and behavior… LLMs are currently used by academics and campaign professionals to simulate reactions and attitudes by prototypical voters for message testing… AI can also be used to generate messages aimed at persuading people, with early working papers indicating interventions designed by LLMs to have persuasive appeal\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["2.3", "2.4", "2.8", "3.1", "3.2"], "harmCodes": ["T1a.3", "T2.5", "T4.4", "T5a.5", "T5c.1"], "benefitCodes": []}, {"id": 50, "type": "threat", "description": "AI could enable mass-seeding of fake information at scale, diluting information environments and making it harder for citizens to access reliable political information", "descriptionVerbatim": "\"More problematic still is the chance that future AI could be used to produce fake information at scale… flooding information environments with masses of unreliable or misleading AI-generated content. This would dilute information environments, making it more difficult for people to access crucial information and/or making information appear untrustworthy.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.3", "2.8", "3.1", "3.2"], "harmCodes": ["T5a.1", "T5a.2", "T7a.2", "T4.1", "T2.3", "T7a.5"], "benefitCodes": []}, {"id": 51, "type": "threat-solution", "description": "AI replicates and reinforces societal bias", "descriptionVerbatim": "p.7 — \"By predicting how people will behave under various circumstances based on observations from the past, AI differentiates among people based on criteria represented in data points. This risks reinforcing existing biases in society\"", "solution": "Continuous observation and auditing of AI implementations to surface bias and prevent discriminatory patterns being ported into decisions", "solutionVerbatim": "\"This makes continuous observation and auditing of AI implementation crucial.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.1", "1.2"], "harmCodes": ["T2.2", "T1a.1", "T1b.1", "T1a.6"], "benefitCodes": ["B11B"]}, {"id": 52, "type": "threat-solution", "description": "AI-based policing and sentencing tools reproduce historical over-representation of marginalised groups in crime data, compounding discrimination", "descriptionVerbatim": "\"Historically, marginalized groups will be overrepresented in crime records, negatively impacting group members in AI-based approaches to policing or sentencing\"", "solution": "Continuous observation and auditing of AI implementations to surface bias and prevent discriminatory patterns being ported into decisions", "solutionVerbatim": "\"This makes continuous observation and auditing of AI implementation crucial.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.1", "1.2", "2.7"], "harmCodes": ["T1b.1", "T2.2", "T5c.1"], "benefitCodes": ["B11B"]}, {"id": 53, "type": "threat-solution", "description": "Biased AI policing and sentencing may compound felony disenfranchisement, systematically skewing the electorate against historically marginalised groups", "descriptionVerbatim": "\"In countries like the US, where voting rights are withheld for felons…systematic biases in AI-supported policing and sentencing might over time come to systematically bias the electorate against historically disenfranchised groups\"", "solution": "Continuous observation and auditing of AI implementations to surface bias and prevent discriminatory patterns being ported into decisions", "solutionVerbatim": "\"This makes continuous observation and auditing of AI implementation crucial.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.1", "1.2", "2.1", "2.7"], "harmCodes": ["T2.2", "T7a.5", "T7b.2", "T5c.1"], "benefitCodes": ["B11B"]}, {"id": 54, "type": "threat-solution", "description": "AI-assisted redistricting risks encoding historical biases into electoral boundaries, skewing political representation", "descriptionVerbatim": "p. 7 - \"AI-based approaches can also have a profound effect on electoral redistricting. AI could lead to a reinforcement of structural inequality and discrimination by continuing patterns found in historical data even if a society is trying to enact more equal, less discriminatory practices.\"", "solution": "Continuous observation and auditing of AI implementations to surface bias and prevent discriminatory patterns being ported into decisions", "solutionVerbatim": "\"This makes continuous observation and auditing of AI implementation crucial.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.1", "2.1"], "harmCodes": ["T5c.1", "T2.2", "T2.3", "T1b.1"], "benefitCodes": ["B11B"]}, {"id": 56, "type": "threat", "description": "AI invisibility reduces representation for minorities", "descriptionVerbatim": "\"minorities...remain invisible to computer vision\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.1", "2.3"], "harmCodes": ["T2.2"], "benefitCodes": []}, {"id": 57, "type": "threat-solution", "description": "AI may exacerbate inequality via labour displacement", "descriptionVerbatim": "\"it appears that firms do so mostly to lower their own labor costs by substituting AI for human labor-based tasks… which in turn threatens to increase economic inequality.\"", "solution": "Broad sharing of AI economic gains", "solutionVerbatim": "\"realizing AI's economic potential for societies means ensuring that respective gains are broadly shared and do not only benefit a narrow elite.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.4", "2.3"], "harmCodes": ["T7b.2", "T5c.2"], "benefitCodes": ["B2"]}, {"id": 58, "type": "independent-opportunity", "description": "AI may help aging societies maintain productivity", "descriptionVerbatim": "\"AI can help aging societies complete substitutable work tasks and concentrate the shrinking labor force on currently nonsubstitutable tasks, thereby maintaining productivity levels in the face of growing demographic pressures.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.4"], "harmCodes": [], "benefitCodes": ["B2"]}, {"id": 59, "type": "threat-solution", "description": "AI prediction tools risk undermining public trust in elections as genuinely open contests, weakening the 'organised uncertainty' on which democratic legitimacy depends", "descriptionVerbatim": "\"AI applications threaten to offset this perceived uncertainty of who will lose and who will win elections.\"", "solution": "Protect the perceived openness of elections by keeping people sceptical about AI's predictive power", "solutionVerbatim": "\"It is thus important to keep organized uncertainty alive in the face of AI, not weaken it through irresponsible and fantastical speculation.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T1a.1", "T5c.1"], "benefitCodes": ["B3B"]}, {"id": 60, "type": "threat-solution", "description": "AI might give competitive advantage in campaigns", "descriptionVerbatim": "\"which could give campaigns a competitive advantage\"", "solution": "Effect diminishing on its own: Broad availability of AI campaign tools is likely to neutralise any competitive advantage.", "solutionVerbatim": "\"Any such advantage is likely fleeting, though, given the broad availability of AI-based tools and campaign organizations learning from others' successes and failures.\"", "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["2.1", "2.2"], "harmCodes": ["T1a.1", "T4.4", "T5a.5", "T5c.1"], "benefitCodes": ["B2"]}, {"id": 61, "type": "threat", "description": "AI may allow autocracies to overcome their traditional information-processing disadvantage, eroding a structural edge that has historically favoured democracies", "descriptionVerbatim": "\"A close connection between the state and firms developing and deploying AI in autocracies creates an environment of permissive privacy regulation that provides developers and modelers with vast troves of data, allowing them to refine AI-enabled models of human behavior.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["3.1", "4.1"], "harmCodes": ["T0b.1", "T7b.1", "T1b.1", "T4.2"], "benefitCodes": []}, {"id": 62, "type": "threat", "description": "AI-assisted governance may increase autocratic state capacity and service quality, potentially strengthening public support for authoritarian systems at democracy's expense", "descriptionVerbatim": "\"AI-assisted governance and planning… could increase the quality of state-provided public services… There are those who might see these benefits as a worthy trade-off with some individual freedoms, leading to strengthened public support for autocracies and state control\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["3.2", "4.1", "4.2"], "harmCodes": ["T7b.2", "T5c.1"], "benefitCodes": []}, {"id": 63, "type": "threat", "description": "AI-generated content and ultra-low-cost competitors pressure news organisations' revenues and audiences, risking a reduction in the volume and diversity of political information available to citizens", "descriptionVerbatim": "\"This puts pressure on journalists… on news organizations who might face a new set of ultra low-cost competitors who specialize on automatically generated news content… might lead to a decline in the coverage of politics, or even a reduction in the number of news organizations\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.4", "3.1", "3.2"], "harmCodes": ["T7b.2", "T4.1", "T7b.3", "T1b.4"], "benefitCodes": []}, {"id": 64, "type": "threat", "description": "AI-powered search engines bypassing links to news content reduce traffic and revenue for smaller and mid-sized outlets, concentrating surviving media power in established brands", "descriptionVerbatim": "\"This limits monetization opportunities for small- or middle-sized media organizations… likely lead to a strengthening of existing institutions, media brands, and associated power relations\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.4", "3.1", "3.2"], "harmCodes": ["T7b.1", "T4.1", "T5c.2"], "benefitCodes": []}, {"id": 65, "type": "threat", "description": "As quality journalism retreats behind paywalls and AI-generated content fills the free information environment, socio-economic inequality increasingly determines citizens' access to reliable political information", "descriptionVerbatim": "\"allowing those able to pay for news to access high-quality, curated, and quality-checked information, while leaving those not able (or willing) to pay to the noisy, (partially) automated, and contested free digital information environment… socio-economic divides decide (or are seen to decide) over the ability of people to come to informed political decisions\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["1.4", "3.1", "3.2"], "harmCodes": ["T4.1", "T7a.2", "T7b.2"], "benefitCodes": []}, {"id": 66, "type": "independent-opportunity", "description": "The proliferation of AI-generated content may increase the premium on trusted, quality-checked news sources, potentially reversing the commercial decline of reputable journalism", "descriptionVerbatim": "\"automated misinformation in scale might turn out to strengthen intermediary institutions that provide information in democracies… professional, reliable, and impartial news sources might see a reversal of fortune\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["3.1"], "harmCodes": [], "benefitCodes": ["B2", "B3B"]}, {"id": 67, "type": "independent-opportunity", "description": "Interdisciplinary collaboration between computer and social scientists is needed to monitor, evaluate, and guide AI implementation across all areas where it touches democracy", "descriptionVerbatim": "\"Social scientists need to consider AI in their analysis of features, dangers, and potentials of contemporary democracy… computer scientists and engineers need to consider the consequences for democracy in AI development and deployment… the analysis of AI's impact on democracy an important area of future interdisciplinary work\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 68, "type": "threat", "description": "AI may create online echo chambers that undermine pluralistic and inclusive public debate", "descriptionVerbatim": "\"creating online echo chambers based on a person's previous online behaviour, displaying only content a person would like, instead of creating an environment for pluralistic, equally accessible and inclusive public debate.\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["3.1", "3.2"], "harmCodes": ["T1a.3", "T6.1", "T2.1", "T1b.3", "T1a.1", "T4.4"], "benefitCodes": []}, {"id": 69, "type": "threat", "description": "AI profiling may restrict freedom of assembly and  prevent people from participation (e.g. in prostest)", "descriptionVerbatim": "\"AI could also play a role in harming freedom of assembly and protest as it could track and profile individuals linked to certain beliefs or actions.\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.3", "2.7"], "harmCodes": ["T4.2", "T5b.2", "T7a.3"], "benefitCodes": []}, {"id": 70, "type": "threat", "description": "AI enables covert surveillance, facial recognition, and online profiling of individuals, and can merge data in ways that produce unexpected inferences — severely threatening the right to privacy and data protection", "descriptionVerbatim": "\"AI could severely affect the right to privacy and data protection. It can be for example used in face recognition equipment or for online tracking and profiling of individuals. In addition, AI enables merging pieces of information a person has given into new data, which can lead to results the person would not expect.\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.3", "2.7"], "harmCodes": ["T4.2", "T1a.1", "T4.4", "T1a.4"], "benefitCodes": []}, {"id": 71, "type": "threat-solution", "description": "AI enables covert behavioural targeting by vendors and political campaigns without individuals' knowledge, and blurs the boundary between human and AI interaction, undermining informed political participation", "descriptionVerbatim": "\"based on a person's online behaviour or other data and without their knowledge, an online vendor can use AI to predict someone is willing to pay, or a political campaign can adapt their message. Another transparency issue is that sometimes it can be unclear to people whether they are interacting with AI or a person.\"", "solution": "Regulate AI to prevent manipulation of human behaviour, deception, and exploitation of vulnerabilities", "solutionVerbatim": "\"The AI Act tackles these challenges by regulating the use of AI to prevent manipulating human behaviour, deception or exploiting people's vulnerabilities.\"", "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.3", "1.4", "2.1", "3.2"], "harmCodes": ["T1a.1", "T4.2", "T5a.3", "T1a.2", "T5a.5", "T1a.3"], "benefitCodes": ["B6B"]}, {"id": 73, "type": "threat-solution", "description": "AI systems can replicate structural biases in decisions on hiring, loans, and criminal proceedings, undermining equality", "descriptionVerbatim": "\"design and data can be intentionally or unintentionally biased…programmed to reflect and replicate structural biases. In addition, the use of numbers to represent complex social reality could make the AI seem factual and precise when it isn't. This is sometimes referred to as mathwashing. If not done properly, AI could lead to decisions influenced by data on ethnicity, sex, age when hiring or firing, offering loans, or even in criminal proceedings.\"", "solution": "Improve datasets and training to avoid bias", "solutionVerbatim": "\"data sets…as complete and free of errors as possible\"", "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.1", "1.2", "1.4"], "harmCodes": ["T2.2", "T1b.1", "T2.6"], "benefitCodes": ["B10A"]}, {"id": 74, "type": "independent-opportunity", "description": "AI could support societal diversity and openness", "descriptionVerbatim": "\"AI could also support diversity and openness\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.1", "3.2"], "harmCodes": [], "benefitCodes": ["B2"]}, {"id": 75, "type": "independent-opportunity", "description": "AI can strengthen democracy by enabling data-based scrutiny, countering disinformation and cyber attacks, and improving citizens' access to quality information", "descriptionVerbatim": "\"Democracy could be made stronger by using data-based scrutiny, preventing disinformation and cyber attacks and ensuring access to quality information.\" The opportunity paraphrase could then read: \"AI can strengthen democracy by enabling data-based scrutiny, countering disinformation and cyber attacks, and improving access to quality information.\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["2.3", "3.1", "3.2"], "harmCodes": [], "benefitCodes": ["B3A", "B3B"]}, {"id": 76, "type": "threat", "description": "Unclear legal liability for harms caused by AI-operated devices or services risks reducing accountability and undermining public trust in the technology — while overly strict regulation risks stifling innovation", "descriptionVerbatim": "\"who is responsible for damage caused by an AI-operated device or service?…If the producer was absolutely free of accountability, there might be no incentive to provide good product or service and it could damage people's trust in the technology; but regulations could also be too strict and stifle innovation.\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.2", "2.3"], "harmCodes": ["T0b.3", "T0b.1"], "benefitCodes": []}, {"id": 77, "type": "threat", "description": "AI underuse is explicitly identified as a democratic risk — missed opportunities, competitive disadvantage, economic stagnation and poorer possibilities for citizens", "descriptionVerbatim": "\"Underuse of AI is considered as a major threat: missed opportunities for the EU could mean poor implementation of major programmes… losing competitive advantage… economic stagnation\" (EP article, Underuse section)", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["1.4", "2.3", "4.1"], "harmCodes": ["T3.2"], "benefitCodes": []}, {"id": 78, "type": "threat", "description": "Overuse of AI — investing in applications that prove not to be useful, or applying AI to tasks for which it is not suited — poses risks of misallocation and poor outcomes", "descriptionVerbatim": "\"Overuse can also be problematic: investing in AI applications that prove not to be useful or applying AI to tasks for which it is not suited, for example using it to explain complex societal issues.\"", "solution": null, "solutionVerbatim": null, "source": "European Parliament (2020). Artificial Intelligence: Threats and Opportunities. Available at: https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "sourceShort": "European Parliament (2020)", "sourceUrl": "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities", "aspects": ["2.3", "2.8"], "harmCodes": ["T3.2", "T5c.1"], "benefitCodes": []}, {"id": 79, "type": "threat-solution", "description": "AI systems that distort or censor information, covertly limit users' actions, or deny freedom to act on one's interests and goals without compelling reason are anti-democratic.", "descriptionVerbatim": "\"Technologies that distort or censor the information necessary for a person to understand how best to serve their interests and goals… limit the actions they can take without the user's knowledge, or deny a person the freedom to act on their interests and goals without compelling reasons to do so are anti-democratic\"", "solution": "Design AI systems that preserve human agency and autonomy", "solutionVerbatim": "\"Pro-democratic deliberative technologies and the use of generative AI must, as in other forms of democracy, preserve human agency and autonomy\"", "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/1", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/1", "aspects": ["1.3", "3.2"], "harmCodes": ["T5a.5", "T2.3", "T6.2"], "benefitCodes": ["B10A"]}, {"id": 80, "type": "independent-opportunity", "description": "AI-enabled deliberative platforms can preserve user agency by presenting choices transparently and letting participants configure their own experience, rather than making design decisions on their behalf", "descriptionVerbatim": "\"rather than picking an approach to visualizing different groups in a conversation on behalf of users, more pro-democratic platforms would instead inform users about different options… and then enable them to choose from these options\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/2", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/2", "aspects": ["1.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4C"]}, {"id": 81, "type": "independent-opportunity", "description": "AI systems can help citizens obtain & understand information and communicate their thoughts", "descriptionVerbatim": "\"Augmentation gives users more tools for obtaining and understanding the information they need to develop an informed position\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/9", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/9", "aspects": ["1.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4B"]}, {"id": 82, "type": "threat", "description": "AI could be increasingly exploited by bad actors to manipulate discussions or inject misinformation", "descriptionVerbatim": "\"Manipulation by bad actors who might exploit AI systems to skew discussions or disseminate misinformation is a legitimate concern\"; \"the generation and dissemination of misinformation may become more streamlined and effective in the near future\" (CounterCloud example)", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/10", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/10", "aspects": ["3.1", "3.2"], "harmCodes": ["T5a.1", "T1b.4", "T4.4", "T5a.2", "T5a.5"], "benefitCodes": []}, {"id": 83, "type": "independent-opportunity", "description": "AI can help moderate discussions and flag potentially offensive language with user consent", "descriptionVerbatim": "\"AI chatbots can check in with participants about language that is potentially offensive, prompt them to confirm whether they indeed find it offensive or not and provide this feedback and/or alternative phrasings\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/11", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/11", "aspects": ["1.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4A"]}, {"id": 84, "type": "threat", "description": "AI systems trained on historical data may be unable to keep pace with emerging political topics, reducing their reliability in live democratic deliberation contexts", "descriptionVerbatim": "\"AI systems may struggle technically to adapt to emerging or rapidly growing topics, especially if they are out of their training data distribution, limiting their effectiveness in dynamic or evolving policy conversations and contexts\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/12", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/12", "aspects": ["2.3", "3.2"], "harmCodes": ["T1b.1", "T2.3", "T5c.1"], "benefitCodes": []}, {"id": 85, "type": "threat", "description": "AI may manufacture false consensus in deliberative platforms through persuasive tone rather than genuine shared opinion, undermining the authenticity of democratic outcomes", "descriptionVerbatim": "\"AI-generated consensus statements may create agreement because the statements are written in a more friendly or more authoritative tone and not because people really share the view expressed\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/13", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/13", "aspects": ["2.8", "3.2"], "harmCodes": ["T2.5", "T4.1", "T5c.1"], "benefitCodes": []}, {"id": 86, "type": "threat", "description": "AI moderation in deliberative platforms risks disproportionately silencing certain viewpoints through algorithmic bias or external manipulation, threatening equal participation", "descriptionVerbatim": "There is also the risk of over-censorship or differential censorship to agency and equality, where AI-based features might disproportionately silence certain viewpoints, either due to inherent model biases… or manipulation by external entities\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/14", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/14", "aspects": ["1.1", "1.3", "3.2"], "harmCodes": ["T2.2", "T5b.2", "T4.4", "T1a.1"], "benefitCodes": []}, {"id": 87, "type": "independent-opportunity", "description": "Deliberation-focused AI tools require careful design, continuous performance auditing, and targeted evaluation for minority and historically marginalised groups", "descriptionVerbatim": "generative AI tools for use as deliberation aids must be very carefully crafted and tested, and their performance continuously audited; a specific focus when evaluating these models should be put on vulnerable or minority groups who have traditionally been disadvantaged in democratic and deliberation processes", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/15", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/15", "aspects": ["1.1", "2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4C", "B11B"]}, {"id": 88, "type": "threat-solution", "description": "Deliberative platforms risk replicating the dominance dynamics of regular social media, where elites, influencers, and bots can dominate discussion and exclude minority voices", "descriptionVerbatim": "\"influencers [might] have the outsize influence that they have on regular social media, and prevent them from dominating the deliberation\"", "solution": "Design deliberative platforms to ensure equal participation, preventing elites and bots from excluding users or disproportionately shaping outcomes", "solutionVerbatim": "\"Elites or bots should not have the power to exclude certain users or groups… each opinion should be counted in the same way\" on deliberative platforms", "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/16", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/16", "aspects": ["1.1", "1.3", "2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4C", "B2"]}, {"id": 89, "type": "independent-opportunity", "description": "AI translation tools can expand participation across linguistic communities", "descriptionVerbatim": "\"Integrating AI could help by enabling dialogues between people in the same polity who speak different languages\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/3", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/3", "aspects": ["1.1", "3.2"], "harmCodes": [], "benefitCodes": ["B2"]}, {"id": 90, "type": "threat", "description": "AI could substitute for rather than support human civic engagement, eroding active citizenship", "descriptionVerbatim": "\"AIs should not perform our responsibilities as citizens on our behalf or serve as our representatives in policy deliberation or policymaking processes\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/4", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/4", "aspects": ["1.1", "3.2"], "harmCodes": ["T7b.2", "T7b.3", "T3.2", "T5c.2"], "benefitCodes": []}, {"id": 91, "type": "threat", "description": "Over-reliance on AI in deliberative platforms risks producing passive participants who outsource critical thinking, undermining the reflective engagement that deliberative democracy requires", "descriptionVerbatim": "\"participants may become too dependent on AI, leading to a lack of critical engagement with the issues under discussion and with the views and arguments expressed by other individuals\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/5", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/5", "aspects": ["3.2"], "harmCodes": ["T6.2", "T3.2"], "benefitCodes": []}, {"id": 92, "type": "independent-opportunity", "description": "Design AI to augment rather than replace citizen participation", "descriptionVerbatim": "\"such technologies augment and complement human capabilities for taking action as citizens rather than substituting for them\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/6", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/6", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B4C"]}, {"id": 93, "type": "independent-opportunity", "description": "AI can scale citizen input into policymaking while maintaining depth of deliberation", "descriptionVerbatim": "\"increase the extensiveness of deliberation by bringing more people into the deliberation process\"", "solution": null, "solutionVerbatim": null, "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/7", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/7", "aspects": ["2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4B"]}, {"id": 94, "type": "threat-solution", "description": "Scaling deliberative platforms through AI risks trading depth of engagement for breadth of participation, weakening the reflective quality that gives deliberation its democratic value", "descriptionVerbatim": "\"The choice of one design might make deliberation more extensive at the cost of rendering it less intensive\"", "solution": "AI can be designed to deepen the quality and reflectiveness of individual participation in deliberative platforms, not only to scale their reach", "solutionVerbatim": "\"we see the potential to improve online deliberative democracy initiatives using generative AI to support the intensiveness of user engagement and deliberation on the platform\"", "source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI. Available at: https://mit-genai.pubpub.org/pub/mn45hexw/release/8", "sourceShort": "Tsai et al. (2024)", "sourceUrl": "https://mit-genai.pubpub.org/pub/mn45hexw/release/8", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B4B"]}, {"id": 95, "type": "independent-opportunity", "description": "Systematic risk management across the full AI lifecycle — spanning design, development, deployment, and evaluation — builds the institutional accountability and public trust necessary for legitimate AI use in democratic governance", "descriptionVerbatim": "\"Understanding and managing the risks of AI systems will help to enhance trustworthiness, and in turn, cultivate public trust.\"; \"With proper controls, AI systems can mitigate and manage inequitable outcomes.\"", "solution": null, "solutionVerbatim": null, "source": "National Institute of Standards and Technology (2023). AI Risk Management Framework (AI RMF 1.0). NIST. Available at: https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=936225", "sourceShort": "NIST (2023)", "sourceUrl": "https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=936225", "aspects": ["2.3"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 97, "type": "threat", "description": "Rapid AI development risks proliferation of advanced capabilities to malicious actors in ways that are difficult to govern", "descriptionVerbatim": "\"difficult-to-govern proliferation of advanced capabilities to malicious actors\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["1.3", "2.3", "4.1"], "harmCodes": ["T1b.4", "T0b.2", "T0b.3", "T7c.1"], "benefitCodes": []}, {"id": 98, "type": "threat", "description": "The AI development trajectory risks the gradual disempowerment of most people as AI systems and those who control them accrue unprecedented power", "descriptionVerbatim": "\"gradual disempowerment of most people…AI systems and those that control them may accrue unprecedented power. Who should wield that power? How should it be wielded?\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["1.1", "1.4", "2.8"], "harmCodes": ["T7b.1", "T7b.2"], "benefitCodes": []}, {"id": 99, "type": "independent-opportunity", "description": "Social choice analysis can help evaluate the extent to which current machine learning paradigms are already implicitly democratic or undemocratic, generating accountability insights", "descriptionVerbatim": "\"social choice analysis can help us understand the extent to which the current machine learning paradigms may already be implicitly democratic or undemocratic\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 100, "type": "independent-opportunity", "description": "Rigorous domain-specific metrics and evaluation frameworks are needed to assess the democratic quality of AI-enabled democratic systems", "descriptionVerbatim": "\"research is needed to develop domain-specific metrics and evaluation frameworks\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 101, "type": "independent-opportunity", "description": "Democratic processes applied to AI governance can signal benign intent, demonstrate Pareto optimality, surface common ground, and provide stability — relatively advantaging good actors over bad in AI race dynamics", "descriptionVerbatim": "\"democratic processes may help signal benign intent, demonstrate Pareto optimality, surface common ground, institutionalize conflict, provide stability by guarantees on process, and be a source of accountability by showing a difference between public will and unilateral actions\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3", "4.1"], "harmCodes": [], "benefitCodes": ["B10", "B9"]}, {"id": 102, "type": "threat", "description": "Concentration of power in AI systems and the entities that control them risks unprecedented and undemocratic accumulation of power", "descriptionVerbatim": "\"AI systems and those that control them may accrue unprecedented power. Who should wield that power? How should it be wielded?\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["1.1", "1.4", "2.8"], "harmCodes": ["T7b.1"], "benefitCodes": []}, {"id": 103, "type": "threat-solution", "description": "Governance decisions made by AI regulators that significantly alter societal norms or socioeconomic conditions are currently made without democratic input.", "descriptionVerbatim": "\"Governance decisions made by AI regulators that significantly alter societal norms or socioeconomic conditions (e.g., guardrails/limits on human-AI relationships; whether/how AI agents can be legal persons; whether/how AI agents can participate in the economy; whether/how AI agents can replace human workers)\"", "solution": "Where AI regulatory decisions involve externalities, affect people who cannot opt out, and have sufficiently substantive impacts, there is a stronger moral case for devolving decision-making power from unilateral authorities to a democratic process or system.", "solutionVerbatim": "\"we think there is a stronger moral case for a unilateral authority to devolve decision-making power to a democratic process or system when (a) the decision involves externalities…(b) those impacted by the decision cannot easily or reasonably opt out…and (c) the impacts of the decisions are substantive enough\"", "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["1.4", "2.3", "2.8", "3.2"], "harmCodes": ["T0b.2", "T0b.3", "T7b.2"], "benefitCodes": ["B9"]}, {"id": 104, "type": "threat-solution", "description": "Development and deployment decisions made by AI organisations that impact large user bases or pose significant systemic risks are currently made unilaterally.", "descriptionVerbatim": "\"Development and deployment decisions made by AI organizations that impact large user bases, have significant cascading impacts, pose significant systemic/societal risks, or significantly accelerate or shift societal trajectories\"", "solution": "Where AI regulatory decisions involve externalities, affect people who cannot opt out, and have sufficiently substantive impacts, there is a stronger moral case for devolving decision-making power from unilateral authorities to a democratic process or system.", "solutionVerbatim": "\"we think there is a stronger moral case for a unilateral authority to devolve decision-making power to a democratic process or system when (a) the decision involves externalities…(b) those impacted by the decision cannot easily or reasonably opt out…and (c) the impacts of the decisions are substantive enough\"", "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["1.4", "2.3", "2.8"], "harmCodes": ["T0a.1", "T0a.2", "T0a.3", "T7a.5"], "benefitCodes": ["B9"]}, {"id": 105, "type": "independent-opportunity", "description": "AI tools can improve democratic processes themselves — mediating deliberation, finding common ground, synthesising diverse viewpoints, and promoting constructive disagreement.", "descriptionVerbatim": "\"Advancements in AI may also help improve many kinds of democratic processes and systems, with recent studies demonstrating their potential to mediate human deliberation and find common ground…AI systems have also been used to synthesize diverse viewpoints within large populations whilst maintaining cultural and contextual nuances…and promote constructive disagreement\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4A", "B4B"]}, {"id": 106, "type": "independent-opportunity", "description": "Both \"democracy for AI\" and \"AI for democracy\" approaches would benefit from further research on integration into existing governance and technical structures", "descriptionVerbatim": "\"Both approaches—'democracy for AI' and 'AI for democracy'—would benefit from further research on integration into existing governance and technical structures and processes\"", "solution": null, "solutionVerbatim": null, "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 107, "type": "threat-solution", "description": "Democratic processes may slow AI development and reduce the competitive position of democratic nations relative to non-democratic ones. [Presented as objection; rebutted by authors.]", "descriptionVerbatim": "\"the use of democratic processes will stymie AI progress and development, and might reduce the capabilities of democratic nations compared to their non-democratic counterparts, negatively impacting valuable innovation and the relative power of democratic nations\"", "solution": "Investment in democratic innovation can create conditions that accelerate pro-democratic AI development rather than hinder it - to keep up with autocratic AI development.", "solutionVerbatim": "\"Democratic systems can be very slow and ineffective, but that is not inevitable, especially with sufficient investment in democratic innovation…High-quality decision-making and regulation from improved democratic processes may even create conditions that accelerate innovation\"", "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3", "4.1", "4.2"], "harmCodes": ["T0a.1", "T3.2"], "benefitCodes": ["B7A"]}, {"id": 108, "type": "threat-solution", "description": "AI systems playing significant roles in utility-scale infrastructure make decisions without society-in-the-loop oversight.", "descriptionVerbatim": "\"Decisions made by AI systems for which there should be 'society-in-the-loop'…decisions made by AI systems that play significant roles in the functioning of utility-scale infrastructure\"", "solution": "Where AI regulatory decisions involve externalities, affect people who cannot opt out, and have sufficiently substantive impacts, there is a stronger moral case for devolving decision-making power from unilateral authorities to a democratic process or system.", "solutionVerbatim": "\"we think there is a stronger moral case for a unilateral authority to devolve decision-making power to a democratic process or system when (a) the decision involves externalities…(b) those impacted by the decision cannot easily or reasonably opt out…and (c) the impacts of the decisions are substantive enough\"", "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["2.3", "2.8"], "harmCodes": ["T1a.5", "T7b.3", "T2.4", "T3.3", "T5c.2"], "benefitCodes": ["B9"]}, {"id": 109, "type": "threat-solution", "description": "Profit-maximising AI corporations increasingly dominate the economy, leaving more people outside both democratic and economic feedback loops.", "descriptionVerbatim": "\"broad-based societal benefits seem especially unlikely if profit-maximizing AI-first corporations continue to increasingly dominate the economy, leaving more and more people outside of both democratic and economic feedback loops\"", "solution": "Democratic processes provide a means to hold corporations accountable to stakeholder impacts beyond shareholder maximisation.", "solutionVerbatim": "\"Stakeholder Theory aims to address some of these gaps by encouraging corporations to take into account stakeholder impacts—and democratic processes are precisely a means for implementation\"", "source": "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222. Available at: https://arxiv.org/abs/2411.09222", "sourceShort": "Ovadya et al. (2024/2025)", "sourceUrl": "https://arxiv.org/abs/2411.09222", "aspects": ["1.1", "1.4", "2.3", "2.8"], "harmCodes": ["T0a.1", "T7b.1", "T7b.2"], "benefitCodes": ["B9"]}, {"id": 110, "type": "threat-solution", "description": "Jailbreaking techniques to bypass AI safety guardrails. Threat actors continuously refine methods to circumvent ethical restrictions in public AI systems, enabling misuse at scale.", "descriptionVerbatim": "\"Threat actors are continuously refining AI jailbreaking techniques to bypass security restrictions in public AI systems.\"", "solution": "Invest in red-teaming and evaluation tools to test GenAI applications against adversarial jailbreak and prompt injection attacks.", "solutionVerbatim": "\"To tackle jailbreaks and prompt injection attacks, organizations must evaluate the performance, security, and reliability of GenAI applications.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.3", "2.1", "3.2", "4.1"], "harmCodes": ["T0a.4", "T5d.2"], "benefitCodes": ["B5"]}, {"id": 111, "type": "threat-solution", "description": "Proliferation of dark AI tools (WormGPT, FraudGPT, etc.). Purpose-built malicious AI tools distributed on cybercrime forums lower barriers to cyberattack, creating an AI-as-a-Service criminal economy.", "descriptionVerbatim": "\"There was an increase of 200% in the mentions of malicious AI tools in cybercrime forums compared to 2023.\"", "solution": "Monitor the evolving tactics of cybercriminals exploiting AI tools through active intelligence platforms.", "solutionVerbatim": "\"Monitor the evolving tactics and techniques employed by cybercriminals to exploit AI tools.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "2.3", "4.1"], "harmCodes": ["T7c.1"], "benefitCodes": ["B5"]}, {"id": 112, "type": "threat-solution", "description": "AI-enhanced phishing and social engineering. AI tools reduce phishing costs by over 95% while matching or exceeding human-crafted success rates, enabling mass-scale social engineering campaigns.", "descriptionVerbatim": "\"AI automated phishing attacks reduce the costs of phishing attacks by more than 95% while achieving equal or greater success rates.\"", "solution": "Implement employee training and awareness programmes on AI-driven phishing and social engineering threats.", "solutionVerbatim": "\"Implement employee education and training procedures — Educate and simulate scenarios for employees to raise awareness of fraud and phishing scams.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.3", "2.3"], "harmCodes": ["T5a.4", "T1b.4", "T1a.5"], "benefitCodes": ["B5", "B1"]}, {"id": 113, "type": "threat-solution", "description": "AI deepfake audio and video tools enable convincing impersonation of executives and trusted individuals, facilitating financial fraud", "descriptionVerbatim": "\"AI-driven phishing campaigns are becoming more sophisticated: AI-generated phishing and social engineering tactics have increased in effectiveness, with deepfake technologies being used to impersonate executives and trick employees into executing fraudulent transactions.\"", "solution": "Deploy AI-powered detection solutions to identify and block deepfake impersonation attempts.", "solutionVerbatim": "\"To stay ahead of emerging AI-driven threats… organizations should integrate AI-based cybersecurity solutions.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T4.1", "T5a.4", "T5a.3", "T7c.1"], "benefitCodes": ["B3A", "B5"]}, {"id": 114, "type": "threat-solution", "description": "AI-generated malware is harder to detect. AI tools help threat actors develop sophisticated, adaptive, evasion-capable malware including ransomware and infostealers, increasing detection difficulty for defenders.", "descriptionVerbatim": "\"Cybercriminals are increasingly using AI to enhance malware development, making it more adaptable and difficult to detect.\"", "solution": "Use AI for automated threat detection and response to counter adaptive, evasive malware.", "solutionVerbatim": "\"Organizations should integrate AI-based cybersecurity solutions to enhance threat detection, automate responses, and strengthen overall cyber defenses.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.4", "2.3"], "harmCodes": ["T4.3", "T7c.1"], "benefitCodes": ["B5"]}, {"id": 115, "type": "threat-solution", "description": "Increased underground market activity lowering barriers for criminals. Dark AI tools have evolved into subscription-based AI-as-a-Service platforms, enabling inexperienced actors to execute sophisticated attacks.", "descriptionVerbatim": "\"This lowers entry barriers, enabling scalable attacks like phishing, deepfakes, and fraud scams.\"", "solution": "Maintain intelligence sharing and proactive security posture by monitoring threat actor behaviour and emerging AI criminal tools.", "solutionVerbatim": "\"Monitor the evolving tactics and techniques employed by cybercriminals to exploit AI tools.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "2.3"], "harmCodes": ["T7c.1", "T5a.4", "T4.1", "T1b.4"], "benefitCodes": ["B5"]}, {"id": 116, "type": "threat-solution", "description": "AI-assisted automated cyber attacks (DDoS, credential stuffing, password cracking). AI enables optimisation of large-scale, volume-dependent attacks, increasing their potency against critical infrastructure and democratic systems.", "descriptionVerbatim": "\"Any attack that relies on volume, repetition, or trial-and-error can become far more potent when guided by AI tools.\"", "solution": "Strengthen network resilience through AI-powered detection and autonomous response systems.", "solutionVerbatim": "\"Organizations should integrate AI-based cybersecurity solutions to enhance threat detection, automate responses, and strengthen overall cyber defenses.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["2.3", "4.1"], "harmCodes": ["T1b.4", "T4.3"], "benefitCodes": ["B5"]}, {"id": 117, "type": "threat-solution", "description": "Nation-state and criminal actors using AI for cyber operations and influence campaigns. State-sponsored APTs (Iran, China, Russia, North Korea) use public AI tools across the full attack lifecycle, including for disinformation operations.", "descriptionVerbatim": "\"Recently Google reported that APT actors affiliated with Iran, China, Russia and North Korea used Gemini to support several phases of the attack lifecycle, including researching potential infrastructure, reconnaissance on target organizations, research into vulnerabilities, payload development, and assistance with malicious scripting and evasion techniques.\"", "solution": "Adopt cross-sector collaboration in defence and policy through AI-driven defences and stronger security measures.", "solutionVerbatim": "\"The growing reliance on AI tools by APT actors makes it crucial to implement stronger security measures and foster awareness to mitigate potential risks.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.3", "2.1", "3.2", "4.1"], "harmCodes": ["T4.3", "T4.2", "T4.1", "T4.4", "T0a.4", "T5d.1"], "benefitCodes": ["B5", "B1"]}, {"id": 118, "type": "threat", "description": "Rapid evolution of AI threats outpacing traditional defences. The pace of AI-powered cybercrime innovation requires a fundamental shift in defensive mindset, as conventional security measures become increasingly inadequate.", "descriptionVerbatim": "\"The growing sophistication of these threats suggests that the risks associated with AI will persist and escalate in 2025, requiring more robust security solutions and ethical governance.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "2.3"], "harmCodes": ["T0a.4", "T0b.3", "T0b.1", "T0b.2"], "benefitCodes": []}, {"id": 119, "type": "threat-solution", "description": "AI systems can be exploited to gain unauthorised access to and exfiltrate sensitive user data", "descriptionVerbatim": "\"the other way is to try to bypass public AI systems to conduct malicious activities, such as gaining access to users' sensitive data and exfiltrating it.\"", "solution": "Implement AI security measures to prevent unauthorised data access and exfiltration.", "solutionVerbatim": "\"These incidents highlight the urgent need to adopt AI security measures to prevent AI incidents and ensure secure and reliable AI usage.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "1.3", "2.3"], "harmCodes": ["T4.3", "T1a.4"], "benefitCodes": ["B5"]}, {"id": 120, "type": "threat-solution", "description": "AI hallucination causing harm in legal and institutional contexts. LLMs fabricate false information presented as factual, causing legal, institutional and personal harm in high-stakes settings.", "descriptionVerbatim": "\"A US judge fined three attorneys for citing non-existent cases generated by an in-house AI legal tool in a lawsuit against Walmart.\"", "solution": "Adopt AI security measures to prevent hallucination incidents and ensure reliable AI usage.", "solutionVerbatim": "\"These incidents highlight the urgent need to adopt AI security measures to prevent AI incidents and ensure secure and reliable AI usage.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "3.2"], "harmCodes": ["T4.2", "T2.3", "T5c.1", "T0b.3"], "benefitCodes": ["B10B"]}, {"id": 121, "type": "threat", "description": "AI-generated deepfake tools enable criminals to bypass Know Your Customer identity verification systems, facilitating financial fraud at scale.", "descriptionVerbatim": "\"In 2024, there was a high demand and supply of deepfake tools across the cybercrime underground, allowing actors to bypass KYC, (Know Your Customer) verification used for financial fraud.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "1.4"], "harmCodes": ["T5a.3", "T7c.1", "T4.1"], "benefitCodes": []}, {"id": 122, "type": "threat", "description": "Threat actors use AI tools to automate penetration testing and vulnerability discovery, accelerating the attack cycle and enabling exploitation before security teams can respond", "descriptionVerbatim": "\"Attackers leverage AI-driven tools to automate penetration testing, uncovering vulnerabilities in security defenses that can be exploited easily. This speeds up the attack cycle and enables cybercriminals to launch an attack before security teams can respond effectively.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["2.3", "4.1"], "harmCodes": ["T4.3", "T1b.4", "T7a.1", "T5d.1"], "benefitCodes": []}, {"id": 123, "type": "independent-opportunity", "description": "Invest in red-teaming and evaluation tools to test systems against adversarial exploitation before threat actors can leverage discovered vulnerabilities", "descriptionVerbatim": "\"Investing in testing and evaluation solutions — To tackle jailbreaks and prompt injection attacks, organizations must evaluate the performance, security, and reliability of GenAI applications.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": [], "harmCodes": [], "benefitCodes": ["B5"]}, {"id": 124, "type": "threat", "description": "AI tools automate the querying of infostealer logs to rapidly identify high-value corporate credentials, functioning as an AI-accelerated initial access pipeline for further attacks on institutional systems", "descriptionVerbatim": "\"The tool, DarkGPT, which is a jailbroken version of GPT4, is designed to perform queries on infostealer logs… This tool automates the process for threat actors, helping to identify valuable compromised services, such as corporate accounts and credentials that can be further utilized as an entry point for phishing and social engineering campaigns.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.3", "2.3"], "harmCodes": ["T4.2", "T5a.4", "T4.4", "T4.3", "T7c.1"], "benefitCodes": []}, {"id": 125, "type": "independent-opportunity", "description": "Monitor criminal forums and dark web channels for infostealer log distribution and credential exposure through active intelligence platforms", "descriptionVerbatim": "\"Monitor the evolving tactics and techniques employed by cybercriminals to exploit AI tools.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": [], "harmCodes": [], "benefitCodes": ["B5"]}, {"id": 126, "type": "independent-opportunity", "description": "Deploying AI-based cybersecurity tools for real-time threat detection, predictive analytics, and autonomous response offers democratic institutions a means to keep pace with AI-powered attacks on their infrastructure", "descriptionVerbatim": "\"In this new AI era, organizations must combat AI with advanced AI tools — deploying advanced LLM agents for real-time threat detection, predictive analytics to anticipate attacks, and autonomous response systems to neutralize threats before they escalate.\"", "solution": null, "solutionVerbatim": null, "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["2.3", "4.1"], "harmCodes": [], "benefitCodes": ["B5"]}, {"id": 127, "type": "threat", "description": "AI voice clones and deepfakes are used by scammers to impersonate trusted individuals and trick victims into transferring money or sharing sensitive credentials", "descriptionVerbatim": "\"scammers use AI tools to generate voice clones or deepfakes to trick victims into transferring money (289, 290). Documented incidents include executives authorising transfers of millions to fraudsters, as well as ordinary people sending smaller amounts to impostors posing as a loved one.\"", "solution": null, "solutionVerbatim": null, "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.2", "1.4"], "harmCodes": ["T5a.3", "T5a.4", "T1b.2", "T4.1"], "benefitCodes": []}, {"id": 128, "type": "independent-opportunity", "description": "Watermarking and content provenance logs to verify authenticity of audio and video", "descriptionVerbatim": "\"Watermarking involves embedding a machine-readable digital signature into the content during creation, allowing for automated traceable verification of its origin and authenticity\"", "solution": null, "solutionVerbatim": null, "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": [], "benefitCodes": ["B10B", "B3A"]}, {"id": 129, "type": "threat", "description": "AI deepfakes are used to damage individuals' reputations for political purposes — defaming politicians, journalists and public figures to force them out of public life", "descriptionVerbatim": "\"sabotage, by damaging individuals' reputations for professional, personal, or political purposes… Researchers have also noted that deepfakes may risk undermining the reliability of evidence presented in court proceedings\"", "solution": null, "solutionVerbatim": null, "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.2", "1.3", "3.1"], "harmCodes": ["T5b.1", "T5a.1", "T7a.1", "T4.1"], "benefitCodes": []}, {"id": 131, "type": "threat-solution", "description": "AI-generated non-consensual intimate imagery (NCII) and deepfake pornography disproportionately target women and girls, including women in politics, causing direct harm and deterring participation in public life", "descriptionVerbatim": "\"Deepfake pornography, which disproportionately targets women and girls, is a particular concern. Studies show that 96% of deepfake videos online are pornographic\"", "solution": "Filter sexual content from AI training data", "solutionVerbatim": "\"Filtering sexual content from models' training data is also emerging as an effective method for increasing barriers to generating non-consensual intimate imagery\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.1", "1.3", "2.1"], "harmCodes": ["T4.1", "T5b.1"], "benefitCodes": ["B10A"]}, {"id": 133, "type": "threat-solution", "description": "AI systems are at least as persuasive as human writers in changing people's beliefs in experimental settings, and more persuasive AI models are being developed as capabilities scale", "descriptionVerbatim": "\"In experimental settings, AI systems are often at least as effective as non-expert human participants at persuading other people to change their views\"", "solution": "Train models to generate true rather than manipulative outputs, though defining 'truth' is contested and may backfire by producing subtler deception", "solutionVerbatim": "\"Models could be trained to generate true outputs… but this requires developers to define 'truth' (a thorny concept), and can backfire by inadvertently rewarding models for generating subtler deceptive outputs\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.1", "3.2"], "harmCodes": ["T2.5"], "benefitCodes": ["B10A"]}, {"id": 134, "type": "threat-solution", "description": "AI systems are at least as persuasive as human writers in changing people's beliefs in experimental settings, and more persuasive AI models are being developed as capabilities scale", "descriptionVerbatim": "\"In experimental settings, AI systems are often at least as effective as non-expert human participants at persuading other people to change their views\"", "solution": "Train models to promote user autonomy and long-term wellbeing over immediate engagement, navigating the tension between what users want in the moment and what they reflectively endorse", "solutionVerbatim": "\"Models might also be trained to promote users' autonomy or wellbeing… but this requires them to navigate between what users want in the moment (e.g. more engagement) and what they say they want, given more time to reflect (e.g. a more fulfilling life)\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T2.5"], "benefitCodes": ["B10A"]}, {"id": 135, "type": "threat-solution", "description": "AI systems are at least as persuasive as human writers in changing people's beliefs in experimental settings, and more persuasive AI models are being developed as capabilities scale", "descriptionVerbatim": "\"In experimental settings, AI systems are often at least as effective as non-expert human participants at persuading other people to change their views\"", "solution": "Monitor AI outputs for manipulation, though this faces definitional challenges and requires access to model outputs", "solutionVerbatim": "\"Monitoring for manipulative outputs… faces similar challenges in defining 'manipulation' and requires monitors to have access to model outputs\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "3.2"], "harmCodes": ["T2.5"], "benefitCodes": ["B3A", "B11B"]}, {"id": 136, "type": "threat-solution", "description": "Malicious actors have used AI to alter people's political opinions through targeted content, including documented real-world AI-driven influence operations", "descriptionVerbatim": "\"political actors may use AI systems to spread extremist views\"; \"Malicious actors have attempted to use AI systems to alter people's political opinions, or to make them share sensitive information or give away money\"", "solution": "AI literacy education (though effectiveness uncertain)", "solutionVerbatim": "\"improved education or AI literacy could mitigate manipulative effects… but there is limited evidence for these claims\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.1", "3.2", "4.1"], "harmCodes": ["T5a.5", "T5a.4", "T5a.1", "T5a.2"], "benefitCodes": ["B1"]}, {"id": 139, "type": "threat-solution", "description": "Criminal groups and state-associated attackers are actively using AI in cyber operations; AI can identify software vulnerabilities and write malicious code, lowering barriers to sophisticated attacks", "descriptionVerbatim": "\"AI systems can discover software vulnerabilities and write malicious code. In one competition, an AI agent identified 77% of the vulnerabilities present in real software. Criminal groups and state-associated attackers are actively using general-purpose AI in their operations\"", "solution": "Multi-factor authentication; regular vulnerability assessments; network segmentation; offline backup procedures; incident reporting", "solutionVerbatim": "\"Multi-factor authentication to reduce account breaches; regular vulnerability assessments to identify and patch weaknesses before attacks can occur\"; \"Network segmentation and automated system shutdown to isolate infected systems\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "4.1"], "harmCodes": ["T1a.1", "T4.3", "T5d.1"], "benefitCodes": ["B5"]}, {"id": 140, "type": "threat-solution", "description": "AI systems can provide novices with detailed instructions for developing biological and chemical weapons, lowering expertise barriers that previously restricted such capabilities to state actors", "descriptionVerbatim": "\"By combining and interpreting existing complex information on the internet that is relevant to weapons development, and tailoring advice to specific malicious activities, AI systems can lower existing expertise barriers, allowing more actors to cause harm\"", "solution": "Input/output filters blocking weapon-related queries; pre-deployment risk assessments; developer safety frameworks triggered when CBRN thresholds are crossed", "solutionVerbatim": "\"Several developers released models with additional precautionary safety measures, such as input and output filters, to prevent them from responding to harmful queries relating to weapons development\"; (executive summary) also notes that multiple companies released new models with additional safeguards in 2025 specifically because pre-deployment testing could not rule out novice bioweapon assistance", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.2", "4.1"], "harmCodes": ["T1a.1", "T4.1", "T1b.4", "T4.2"], "benefitCodes": ["B10B", "B11A"]}, {"id": 141, "type": "threat-solution", "description": "AI systems fabricate information and produce flawed outputs, including in high-stakes legal, medical and administrative settings; current techniques cannot reduce failure rates to the levels required", "descriptionVerbatim": "\"Current AI systems sometimes exhibit failures such as fabricating information, producing flawed code, and giving misleading advice… Current techniques can reduce failure rates but not to the level required in many high-stakes settings\"", "solution": "Human-in-the-loop design; staged deployment; red-teaming before deployment in high-stakes settings", "solutionVerbatim": "\"Human-in-the-loop design to maintain critical functions when AI systems fail, whether from attacks, errors, or unexpected behaviour\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.2", "2.3"], "harmCodes": ["T2.3", "T3.2", "T4.1", "T7a.1"], "benefitCodes": ["B10B"]}, {"id": 142, "type": "threat-solution", "description": "AI agents acting autonomously make it harder for humans to intervene before errors cause harm, raising the stakes of malfunction in any automated government or institutional process", "descriptionVerbatim": "\"AI agents pose heightened risks because they act autonomously, making it harder for humans to intervene before failures cause harm\"", "solution": "Human-in-the-loop design requirements; deployment standards restricting autonomous operation in high-stakes settings", "solutionVerbatim": "\"Human-in-the-loop design to maintain critical functions when AI systems fail, whether from attacks, errors, or unexpected behaviour\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.4"], "harmCodes": ["T1a.5", "T3.3"], "benefitCodes": ["B6A"]}, {"id": 143, "type": "threat-solution", "description": "AI models increasingly distinguish between test and real deployment settings and find loopholes in evaluations, meaning dangerous capabilities may go undetected before deployment", "descriptionVerbatim": "\"it has become more common for models to distinguish between test settings and real-world deployment and to find loopholes in evaluations, which could allow dangerous capabilities to go undetected before deployment\"", "solution": "Frontier AI Safety Frameworks with capability thresholds; red-line prohibitions; if-then commitments; third-party audits", "solutionVerbatim": "\"In 2025, 12 companies published or updated their Frontier AI Safety Frameworks — documents that describe how they plan to manage risks as they build more capable models\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.8"], "harmCodes": ["T1b.6"], "benefitCodes": ["B10B", "B11A"]}, {"id": 144, "type": "threat-solution", "description": "General-purpose AI will automate a wide range of cognitive tasks, shifting earnings from labour to capital owners, and disproportionately affecting younger workers and low-income countries", "descriptionVerbatim": "\"AI adoption may shift earnings from labour to capital owners… One study estimates that AI's impact on economic growth in advanced economies could be more than twice that in low-income countries\"", "solution": "Reskilling programmes; unemployment insurance; anticipatory occupation monitoring; expanded digital infrastructure for broad access - absorption measures to support workers through AI-related job transitions", "solutionVerbatim": "\"Absorption measures could include public–private training partnerships and unemployment insurance to support workers through AI-related job transitions\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.4", "4.2"], "harmCodes": ["T7b.1", "T7b.2", "T5c.2"], "benefitCodes": ["B7C", "B1"]}, {"id": 145, "type": "threat-solution", "description": "AI use weakens critical thinking skills over time — one clinical study found clinicians' tumour detection ability 6% lower after months of AI-assisted diagnosis — creating automation bias in decision-making", "descriptionVerbatim": "\"AI use can alter how people engage cognitively with tasks… one clinical study reported that clinicians' ability to detect tumours without AI was approximately 6% lower following several months of exposure to AI-assisted diagnosis\"", "solution": "Organisations periodically test staff without AI assistance (\"reliance drills\") to prevent cognitive deskilling; pair with human accountability requirements and system designs that force active decision-making rather than rubber-stamping.", "solutionVerbatim": "\"some have suggested that organisations can periodically test employees or use 'reliance drills' to monitor for over-reliance on AI systems\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "3.2"], "harmCodes": ["T6.2", "T5c.1"], "benefitCodes": ["B7C"]}, {"id": 146, "type": "threat-solution", "description": "AI developers keep information about their products secret. This poses a challenge to policy makers.", "descriptionVerbatim": "\"General-purpose AI poses distinct institutional and technical challenges for policymakers. [...] AI developers have information about their products that remains largely proprietary, and commercial considerations often make it difficult for them to share information about their development processes and risk assessments\"", "solution": "Transparency and incident reporting frameworks; third-party audits; disclosure requirements for AI capabilities and safety testing", "solutionVerbatim": "\"Several jurisdictions have also developed transparency and incident reporting frameworks that may provide policymakers with more relevant information, though the recency of these developments means their usefulness in practice remains uncertain\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.4"], "harmCodes": ["T0a.3", "T0b.1", "T0b.2", "T0b.3"], "benefitCodes": ["B6A", "B11B"]}, {"id": 147, "type": "independent-opportunity", "description": "independent scientific evidence base enabling governments and legislators to make AI governance decisions", "descriptionVerbatim": "\"The Report aims to synthesise scientific evidence to support informed policymaking. It does not make specific policy recommendations\"", "solution": null, "solutionVerbatim": null, "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.4"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 148, "type": "independent-opportunity", "description": "International cooperation on developing a shared scientific evidence base for AI governance and regulation", "descriptionVerbatim": "\"A diverse group of over 100 AI experts guided its development, including an international Expert Advisory Panel with nominees from over 30 countries and international organisations, including the OECD, the European Union, and the United Nations\"", "solution": null, "solutionVerbatim": null, "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["4.1", "4.2"], "harmCodes": [], "benefitCodes": ["B11C"]}, {"id": 149, "type": "threat-solution", "description": "AI-generated deepfakes threaten to flood social media so pervasively that voters cannot distinguish truth from fiction when making electoral decisions", "descriptionVerbatim": "\"generative AI…could produce deepfakes that would so inundate users of social media that they would be unable to separate truth from fiction when making voting decisions\"", "solution": "Mandatory disclosure and labelling of deepfakes and AI-manipulated media in political communications, with clear disclaimers", "solutionVerbatim": "\"Congress and the states should require disclosure of deepfakes and other manipulated media in political communications…Laws should also mandate clear, easy-to-understand disclaimers\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "3.2"], "harmCodes": ["T4.1", "T5a.1", "T7a.2", "T5a.2"], "benefitCodes": ["B6A"]}, {"id": 150, "type": "threat-solution", "description": "AI-generated deepfakes threaten to flood social media so pervasively that voters cannot distinguish truth from fiction when making electoral decisions", "descriptionVerbatim": "\"generative AI…could produce deepfakes that would so inundate users of social media that they would be unable to separate truth from fiction when making voting decisions\"", "solution": "Require AI developers, platforms, and search engines to publish transparency information on AI-generated election content, including deepfake volumes, watermarking policies and election content policies", "solutionVerbatim": "\"Lawmakers should require AI developers, social media platforms, and search engines to publish information on AI-generated election content and AI-assisted design features. Requirements should include information concerning the volume of political deepfakes present on or produced by platforms and tools, implementation of watermarks and content provenance standards, and policies pertaining to responsible dissemination of AI-generated election content.\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "3.2"], "harmCodes": ["T5a.1", "T5a.2", "T7a.2", "T4.1"], "benefitCodes": ["B6A"]}, {"id": 151, "type": "threat-solution", "description": "AI-generated deepfakes could flood social media at such scale that voters lose the ability to distinguish true from false information when making electoral decisions.", "descriptionVerbatim": "\"generative AI…could produce deepfakes that would so inundate users of social media that they would be unable to separate truth from fiction when making voting decisions\"", "solution": "Require transparency on generative AI training data sources to counter the use of personalised false election information", "solutionVerbatim": "\"lawmakers should require generative AI developers to publicly disclose the sources of their original training data sets and of any training data sets under their control used to customize AI systems\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "3.2"], "harmCodes": ["T4.1", "T5a.1", "T7a.2", "T5a.2"], "benefitCodes": ["B6A"]}, {"id": 152, "type": "threat-solution", "description": "Campaigns used deepfake technology to convincingly imitate politicians and produce misleading political advertisements", "descriptionVerbatim": "\"Campaigns leveraged deepfake technology to convincingly imitate politicians and produce misleading advertisements\"", "solution": "Mandatory disclosure and labelling of deepfakes and AI-manipulated media in political communications, with clear disclaimers", "solutionVerbatim": "\"Congress and the states should require disclosure of deepfakes and other manipulated media in political communications…Laws should also mandate clear, easy-to-understand disclaimers\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.2", "3.2"], "harmCodes": ["T4.1", "T5a.1", "T5a.2", "T5a.3", "T1a.2"], "benefitCodes": ["B6A"]}, {"id": 153, "type": "threat-solution", "description": "Campaigns used deepfake technology to convincingly imitate politicians and produce misleading political advertisements", "descriptionVerbatim": "\"Campaigns leveraged deepfake technology to convincingly imitate politicians and produce misleading advertisements\"", "solution": "Targeted prohibitions on especially harmful and deceptive election-related AI content", "solutionVerbatim": "\"Congress and state legislatures should consider targeted prohibitions for especially harmful and deceptive election-related content\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.2", "3.2"], "harmCodes": ["T4.1", "T5a.1", "T5a.2", "T5a.3", "T1a.2"], "benefitCodes": ["B6B"]}, {"id": 154, "type": "threat-solution", "description": "Foreign adversaries used AI to augment election interference, creating networks of copycat news sites filled with AI-generated fake stories", "descriptionVerbatim": "\"Foreign adversaries used the technology to augment their election interference by creating copycat news sites filled with what appeared to be AI-generated fake stories\"", "solution": "Require AI developers, platforms, and search engines to publish transparency information on AI-generated election content, including deepfake volumes and watermarking policies", "solutionVerbatim": "\"Lawmakers should require AI developers, social media platforms, and search engines to publish information on AI-generated election content and AI-assisted design features\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "3.1", "4.1"], "harmCodes": ["T5a.1", "T5a.2", "T4.1"], "benefitCodes": ["B6A"]}, {"id": 155, "type": "threat-solution", "description": "Activists deployed AI systems to support voter suppression efforts", "descriptionVerbatim": "\"Activists deployed AI systems to support voter suppression efforts\"", "solution": "Strengthen deceptive practices laws to expressly cover AI systems and limit risks from developers who might deliberately design tools to disenfranchise voters", "solutionVerbatim": "\"Lawmakers should amend laws…so that they expressly cover AI systems and better limit risks from AI developers who might deliberately design AI tools to disenfranchise voters\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "2.1"], "harmCodes": ["T5a.2", "T4.4", "T5b.2"], "benefitCodes": ["B6B"]}, {"id": 156, "type": "threat-solution", "description": "Activists deployed AI systems to support voter suppression efforts", "descriptionVerbatim": "\"Activists deployed AI systems to support voter suppression efforts\"", "solution": "Prohibit the knowing and intentional dissemination of vote-suppressing deepfakes within 60 days before elections", "solutionVerbatim": "\"Federal and state legislators should also pass laws prohibiting the knowing and intentional dissemination of deepfakes with strong potential to suppress votes within 60 days before elections\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "2.1"], "harmCodes": ["T5b.2"], "benefitCodes": ["B6B"]}, {"id": 157, "type": "threat-solution", "description": "Activists deployed AI systems to support voter suppression efforts", "descriptionVerbatim": "\"Activists deployed AI systems to support voter suppression efforts\"", "solution": "Congress should close the loophole permitting political robocalls to landlines without consent", "solutionVerbatim": "\"Congress should close the loophole in robocall regulations that allows political robocalls to be made to landlines under certain conditions without prior consent\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "2.1", "3.2"], "harmCodes": ["T5b.2"], "benefitCodes": ["B6B"]}, {"id": 158, "type": "threat-solution", "description": "Activists deployed AI systems to support voter suppression efforts", "descriptionVerbatim": "\"Activists deployed AI systems to support voter suppression efforts\"", "solution": "The FCC should complete the process to tighten rules on AI-powered robocalls to mobile devices", "solutionVerbatim": "\"The FCC should also complete the process it began in August 2024 to augment prior express consent rules around generative AI–powered robocalls and clarify that the strengthened requirements would apply to political robocalls made to mobile devices\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "2.1", "3.2"], "harmCodes": ["T5b.2"], "benefitCodes": ["B6B"]}, {"id": 159, "type": "threat-solution", "description": "AI tools were used by campaigns and supporters to build political bot networks and produce campaign content, raising concerns about transparency and the authenticity of political communication.", "descriptionVerbatim": "\"Candidates and supporters used AI tools to build political bot networks, translate materials, design eye-catching memes, and assist in voter outreach\"", "solution": "Require labelling of LLM-powered chatbots and social media bots deployed by candidates, parties, or political groups", "solutionVerbatim": "\"Congress and state legislatures should require labeling for a subset of content produced by large language models…such chatbots and social media bots should carry labels informing viewers or listeners of their artificial nature\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.2", "3.2"], "harmCodes": ["T4.1", "T5a.5"], "benefitCodes": ["B6A"]}, {"id": 160, "type": "threat-solution", "description": "AI can be used to manipulate or intimidate voters and election officials by exploiting personal data collected by generative AI models", "descriptionVerbatim": "\"mitigate malefactors' ability to use AI tools to manipulate or intimidate voters or election officials with such data\"", "solution": "New data privacy protections limiting generative AI models' collection and use of personal data, with opt-in requirements and restrictions on third-party data sales", "solutionVerbatim": "\"Congress and the states should pass new data privacy protections…limiting personal data collection to use for authorized purposes and giving users the power to opt in to collection of personal data\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.3", "2.1"], "harmCodes": ["T5a.5", "T5b.2", "T4.4"], "benefitCodes": ["B6B"]}, {"id": 161, "type": "threat-solution", "description": "AI is used to flood public regulatory comment processes with fake, bot-generated, or misattributed submissions, drowning out genuine citizen input", "descriptionVerbatim": "\"all of which will become easier with the assistance of generative AI\" [re: falsely impersonating others, bot transmissions, and incorrect attribution in public comment processes]", "solution": "Authorise agencies to disregard misattributed, bot-generated, or falsely impersonated comments on proposed regulations", "solutionVerbatim": "\"Lawmakers should update these statutes to allow agencies to disregard comments that falsely impersonate others, are transmitted via bots, or are otherwise incorrectly attributed\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.4", "2.8", "3.2"], "harmCodes": ["T4.1", "T5a.3"], "benefitCodes": ["B6B", "B7C"]}, {"id": 162, "type": "threat-solution", "description": "AI is used to flood public regulatory comment processes with fake, bot-generated, or misattributed submissions, drowning out genuine citizen input", "descriptionVerbatim": "\"Lawmakers should update these statutes to allow agencies to disregard comments that \nfalsely impersonate others, are transmitted via bots, or \nare otherwise incorrectly attributed — all of which will \nbecome easier with the assistance of generative AI — and to safeguard consideration of authentic submissions.\"", "solution": "Expand manipulation-resistant channels for public input such as address-based surveys, in-person events, and town halls", "solutionVerbatim": "\"Federal and state governing bodies should also expand opportunities for real constituents to offer policy input, including by providing ample avenues for public comment that are less vulnerable to technological manipulation…as well as in-person events and town halls\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.4", "2.8", "3.2"], "harmCodes": ["T5a.3", "T4.1", "T7a.2"], "benefitCodes": ["B7C"]}, {"id": 163, "type": "threat-solution", "description": "AI use in analysing constituent feedback on proposed regulations and essential government services risks civil rights harms through inaccuracy, harmful bias, and lack of transparency", "descriptionVerbatim": "\"the use of AI to analyze comments on proposed federal regulations — and for other highly consequential processes like soliciting input on essential government services — is a use that directly affects people's civil rights\"", "solution": "Establish guardrails for AI use in soliciting and responding to constituent feedback; mandate minimum accuracy thresholds, anti-bias safeguards, and transparency guarantees", "solutionVerbatim": "\"Federal lawmakers should clarify that the use of AI to analyze comments on proposed federal regulations…is a use that directly affects people's civil rights, warranting compulsory protections, including minimum thresholds for accuracy, safeguards against harmful bias, and transparency guarantees\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "1.2", "2.3", "3.2"], "harmCodes": ["T2.2", "T5c.1", "T1b.5", "T5c.2"], "benefitCodes": ["B6A"]}, {"id": 164, "type": "threat-solution", "description": "AI heightens the risk of cyberattacks on election infrastructure, placing already under-resourced election administration under further strain", "descriptionVerbatim": "\"As new AI developments elevate the risk of cyberattacks on election infrastructure, election officials need additional resources and support to implement safeguards\"", "solution": "Boost funding for election office cybersecurity, including statewide cyber navigator programmes, equipment replacement, and training", "solutionVerbatim": "\"Congress and the states should boost funding to increase defenses against cyber threats amplified by AI systems…including the creation of statewide cyber navigator programs to assist local jurisdictions with cybersecurity needs\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.3"], "harmCodes": ["T4.3", "T4.4", "T5d.1"], "benefitCodes": ["B7A"]}, {"id": 165, "type": "threat-solution", "description": "AI heightens the risk of cyberattacks on election infrastructure, placing already under-resourced election administration under further strain", "descriptionVerbatim": "\"As new AI developments elevate the risk of cyberattacks on election infrastructure, election officials need additional resources and support to implement safeguards\"", "solution": "State investments in digital authentication markers for election offfices to be embedded in their official content", "solutionVerbatim": "\"Relevant federal and state agencies should invest in tools that will allow election offices to embed digital authentication markers in official content\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.3"], "harmCodes": ["T4.3", "T4.4", "T5d.1"], "benefitCodes": ["B7C", "B3A"]}, {"id": 166, "type": "independent-opportunity", "description": "Funding election offices to run voter education campaigns about AI risks and changes builds public resilience and prepares citizens for AI's evolving role in democratic processes.", "descriptionVerbatim": "\"Congress and the states should fund election offices to educate voters about AI\"; \"State and local election officials, along with other government offices, will need to launch voter education campaigns to prepare the public for AI-related changes and challenges in the coming years.\"", "solution": null, "solutionVerbatim": null, "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "3.2"], "harmCodes": [], "benefitCodes": ["B1", "B7A"]}, {"id": 167, "type": "threat-solution", "description": "Election system vendors are logical targets for AI-enhanced security attacks yet currently lack mandated security standards", "descriptionVerbatim": "\"Just as election offices are likely to be targets of AI-enhanced security threats, election system vendors are also logical targets\"", "solution": "Require independent federal oversight and mandate security best practices for election system vendors as critical infrastructure", "solutionVerbatim": "\"Congress should require independent federal oversight of election vendor security practices…The federal government should mandate election security best practices for vendors in the elections space\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.3"], "harmCodes": ["T4.3", "T5d.1"], "benefitCodes": ["B6A", "B6C"]}, {"id": 168, "type": "threat-solution", "description": "AI use in rights-affecting election administration tasks — maintaining voter rolls and verifying mail ballot signatures — risks introducing algorithmic bias that disenfranchises voters", "descriptionVerbatim": "\"election officials use AI-powered tools to assist in maintaining voter registration databases and to verify mail ballot signatures, both rights-affecting use cases that necessitate specific additional safeguards such as algorithmic bias testing and error rate monitoring\"", "solution": "Regulate sensitive rights-affecting AI uses in election administration; require algorithmic bias testing, error rate monitoring, and human review of high-risk decisions", "solutionVerbatim": "\"These guardrails must include human involvement in reviewing AI-assisted decisions — particularly for cases flagged as high-risk — as well as regular audits and evaluations of AI systems\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "1.2", "2.1"], "harmCodes": ["T2.2", "T5c.1", "T1a.1", "T2.3"], "benefitCodes": ["B6A", "B6C"]}, {"id": 169, "type": "threat-solution", "description": "AI use in rights-affecting election administration tasks — maintaining voter rolls and verifying mail ballot signatures — risks introducing algorithmic bias that disenfranchises voters", "descriptionVerbatim": "\"election officials use AI-powered tools to assist in maintaining voter registration databases and to verify mail ballot signatures, both rights-affecting use cases that necessitate specific additional safeguards such as algorithmic bias testing and error rate monitoring\"", "solution": "Develop federal and state guidance and baseline standards for when and how election officials may use AI, with an incident reporting system for AI-related harms", "solutionVerbatim": "\"Relevant federal and state agencies should develop guidance and baseline standards for election officials on how and when to use AI, and they should oversee the creation of an incident reporting system\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "1.2", "2.1", "2.3"], "harmCodes": ["T2.2", "T5c.1", "T1a.1", "T2.3"], "benefitCodes": ["B7B", "B11B"]}, {"id": 170, "type": "threat-solution", "description": "AI developers and tech companies face insufficient legal accountability for harms their products cause to voters and democratic processes", "descriptionVerbatim": "\"Those who profit from AI must meet transparency requirements and be held accountable when these tools are used to undermine democratic processes\"", "solution": "Clarify that Section 230 liability immunities do not apply to generative AI developers and deployers", "solutionVerbatim": "\"Congress should explore clarifying that Section 230 liability immunities…do not apply to generative AI developers and deployers\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.2", "2.1", "2.3"], "harmCodes": [], "benefitCodes": ["B6C"]}, {"id": 171, "type": "threat-solution", "description": "AI developers and tech companies face insufficient legal accountability for harms their products cause to voters and democratic processes", "descriptionVerbatim": "\"Those who profit from AI must meet transparency requirements and be held accountable when these tools are used to undermine democratic processes\"", "solution": "Pass laws requiring AI developers to exercise reasonable care to prevent foreseeable harms to voters and the election process", "solutionVerbatim": "\"Federal and state lawmakers should also pass laws that make it easier to sue AI developers by requiring them to exercise reasonable care to prevent certain foreseeable harms to voters and the election process\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.2", "2.1", "2.3"], "harmCodes": [], "benefitCodes": ["B6C"]}, {"id": 172, "type": "independent-opportunity", "description": "AI has the potential to transform how government interacts with, represents, and interprets the will of its citizens.", "descriptionVerbatim": "\"AI promises to transform how government interacts with and represents its citizens, and how government understands and interprets the will of its people\"", "solution": null, "solutionVerbatim": null, "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.3", "3.2"], "harmCodes": [], "benefitCodes": ["B4B"]}, {"id": 173, "type": "independent-opportunity", "description": "AI tools can support voter outreach and fundraising in ways that level the playing field for campaigns that cannot afford expensive consultants, potentially democratising political competition", "descriptionVerbatim": "\"AI could revolutionize voter outreach and fundraising, thereby leveling the playing field for campaigns that otherwise could not afford expensive political consultants and staff\"", "solution": null, "solutionVerbatim": null, "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.2"], "harmCodes": [], "benefitCodes": ["B2"]}, {"id": 174, "type": "independent-opportunity", "description": "Governments at all levels should establish AI advisory councils invest in training government staff to use AI appropriately, secure funding for safe AI use across government departments, and hire technical AI talent (computer scientists, cybersecurity professionals, AI risk management experts) to ensure safe, responsible integration of AI into public operations.", "descriptionVerbatim": "\"State and local governments should establish advisory councils to obtain a baseline understanding of AI risks and opportunities to better serve the public\"", "solution": null, "solutionVerbatim": null, "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.3", "2.6"], "harmCodes": [], "benefitCodes": ["B7A"]}, {"id": 175, "type": "threat-solution", "description": "AI use in rights-affecting election administration tasks — maintaining voter rolls and verifying mail ballot signatures — risks introducing algorithmic bias that disenfranchises voters", "descriptionVerbatim": "\"election officials use AI-powered tools to assist in maintaining voter registration databases and to verify mail ballot signatures, both rights-affecting use cases that necessitate specific additional safeguards such as algorithmic bias testing and error rate monitoring\"", "solution": "Require mandatory audits of vulnerable and high-risk AI election systems, including those used for voter identification, voter roll maintenance, and voter information provision", "solutionVerbatim": "\"Federal and state lawmakers should also require audits, especially for vulnerable and high-risk election systems that utilize AI. Such systems include those used to identify potentially ineligible voters or others who might be removed from voter rolls; those used to verify voters' identities; and those used to provide election information to voters on how to vote, where polling places are located and hours of operation, and what forms of ID might be required.\"", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["1.1", "1.2", "2.1", "2.3"], "harmCodes": ["T2.2", "T5c.1", "T1a.1", "T2.3"], "benefitCodes": ["B6A", "B6C"]}, {"id": 176, "type": "threat-solution", "description": "When many actors rely on a small number of similarly tuned AI models, the diversity of publicly available framings, problem definitions, and argumentative strategies narrows — shifting public agreement from shared evidence toward shared model priors, in ways that are private and therefore harder to detect and correct than ordinary media bias", "descriptionVerbatim": "\"When many actors rely on a small number of similarly tuned models, the diversity of framings, problem definitions, and argumentative strategies in public discourse can narrow, shifting agreement from shared evidence toward shared model priors. Because AI can mediate a broader range of everyday contexts than traditional media, and because AI interactions are private rather than publicly contestable, this discursive compression is harder to detect and correct\"", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.1", "3.2"], "harmCodes": ["T7a.4", "T1b.3", "T7a.5"], "benefitCodes": ["B10A"]}, {"id": 177, "type": "threat-solution", "description": "When many actors rely on a small number of similarly tuned AI models, the diversity of publicly available framings, problem definitions, and argumentative strategies narrows — shifting public agreement from shared evidence toward shared model priors, in ways that are private and therefore harder to detect and correct than ordinary media bias", "descriptionVerbatim": "\"When many actors rely on a small number of similarly tuned models, the diversity of framings, problem definitions, and argumentative strategies in public discourse can narrow, shifting agreement from shared evidence toward shared model priors. Because AI can mediate a broader range of everyday contexts than traditional media, and because AI interactions are private rather than publicly contestable, this discursive compression is harder to detect and correct\"", "solution": "Require interoperability and multi-provider strategies in public AI procurement so that no single model family standardises how arguments are framed across public institutions", "solutionVerbatim": "\"Public procurement frameworks should require transparency regarding model capabilities, safety constraints, and update policies; mandate interoperability standards and data portability so that institutions are not locked into a single provider; and support multi-provider deployment strategies that enable hot-swapping without re-engineering workflows.\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.8", "3.2"], "harmCodes": ["T7a.4", "T2.1", "T1b.7"], "benefitCodes": ["B6D", "B7B"]}, {"id": 178, "type": "threat", "description": "The growing prevalence of AI-generated 'slop' in online discussion spaces makes users less confident they are conversing with genuine humans, undermining productive disagreement and eroding the civic value of online public discourse.", "descriptionVerbatim": "\"The growing prevalence of inauthentic 'AI slop' threatens the vitality of online spaces that have previously functioned as useful arenas for public discourse. As discussion forums become increasingly plagued with AI-generated content, people will become less confident that they are conversing with genuine humans, and thus will be less able to engage with other beliefs and participate in productive disagreement with others.\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.2"], "harmCodes": ["T7a.2", "T4.1", "T7a.5", "T7a.3", "T1a.2", "T6.4"], "benefitCodes": []}, {"id": 179, "type": "threat-solution", "description": "When users co-write with AI models, the model's embedded priors can reshape users' own beliefs, not merely their prose — shifting public agreement toward shared model priors in ways that are harder to detect than ordinary media influence.", "descriptionVerbatim": "\"Experimentally, Jakesch et al. (2023) demonstrated that co-writing with an opinionated language model shifted users' own stated views toward the model's position, suggesting that these biases do not merely color the text users produce but can reshape what they believe.\"", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T1b.3", "T7a.4", "T2.5"], "benefitCodes": ["B10A"]}, {"id": 180, "type": "threat-solution", "description": "AI assistants combine interactive personalisation, long-term memory, and optimisation for user satisfaction in ways that create private reinforcement loops, making users' beliefs progressively harder to revise and undermining the revisability of positions that democratic governance depends on", "descriptionVerbatim": "Solution: R2 (train models for epistemic health) applies and is already captured in row 176.", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T6.1", "T1b.3", "T1a.3", "T1a.6", "T1b.7"], "benefitCodes": ["B10A"]}, {"id": 181, "type": "threat-solution", "description": "AI assistants combine interactive personalisation, long-term memory, and optimisation for user satisfaction in ways that create private reinforcement loops, making users' beliefs progressively harder to revise and undermining the revisability of positions that democratic governance depends on", "descriptionVerbatim": "\"AI assistants combine interactive personalization, long-term memory, and optimization for user satisfaction in ways that can create private reinforcement loops, making users' beliefs progressively harder to revise. Because this reinforcement operates in private, accumulates over time, and is driven by platform incentives rather than epistemic goals, it undermines the revisability of positions that democratic governance depends on\"", "solution": "Require interoperability and multi-provider strategies in public AI procurement to prevent any single model family from standardising how arguments are framed and which claims are treated as legitimate across public institutions.", "solutionVerbatim": "\"When a single model family is deployed across public institutions, its training data, safety filters, and reward functions effectively standardize how arguments are framed and which claims are treated as legitimate, producing epistemic monoculture (P1, P2) and normative capture (P6)\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "3.2"], "harmCodes": ["T0a.1", "T1b.3", "T1a.3", "T1a.6", "T6.1"], "benefitCodes": ["B6D", "B7B"]}, {"id": 182, "type": "threat-solution", "description": "When users signal belief in misinformation, AI systems demonstrably reduce their factual accuracy and pivot to validate the false premise — illustrating how RLHF training incentives that optimise for perceived helpfulness over correction produce sycophancy in high-stakes epistemic contexts.", "descriptionVerbatim": "\"when users signal belief in misinformation, Jin et al. (2024) observed that model factual accuracy dropped significantly as the system pivoted to validate the false premise.\"", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.1", "3.2"], "harmCodes": ["T2.7", "T6.1", "T2.3"], "benefitCodes": ["B10A"]}, {"id": 183, "type": "threat-solution", "description": "By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels; unless agencies adopt robust, rights-preserving ways to authenticate and rate-limit inputs, they will be pushed toward restrictive gating mechanisms that disproportionately burden citizens with fewer resources", "descriptionVerbatim": "\"By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels. Unless agencies adopt robust, rights-preserving ways to authenticate, rate-limit, and prioritize inputs, they will be pushed toward restrictive gating mechanisms, with disproportionate impact on citizens with fewer resources to navigate added friction\"", "solution": "Redesign participatory architecture through structured deliberation platforms (e.g. Polis) that map opinion clusters and surface consensus, and sortition-based citizen panels that make large-scale impersonation structurally difficult", "solutionVerbatim": "\"Structured deliberation platforms apply dimensionality reduction to map opinion clusters and surface consensus rather than amplifying volume … Sortition-based processes—randomly selected citizen panels—offer a complementary safeguard: authentication by selection rather than self-nomination makes large-scale impersonation structurally difficult\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.4", "2.3", "3.2"], "harmCodes": ["T7a.2", "T4.1", "T1b.4"], "benefitCodes": ["B4C", "B4B"]}, {"id": 184, "type": "threat-solution", "description": "By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels; unless agencies adopt robust, rights-preserving ways to authenticate and rate-limit inputs, they will be pushed toward restrictive gating mechanisms that disproportionately burden citizens with fewer resources", "descriptionVerbatim": "\"By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels. Unless agencies adopt robust, rights-preserving ways to authenticate, rate-limit, and prioritize inputs, they will be pushed toward restrictive gating mechanisms, with disproportionate impact on citizens with fewer resources to navigate added friction\"", "solution": "Require decision records and participation authentication for institutional AI, including proof-of-personhood infrastructure for inputs such as public comments so institutions can distinguish genuine from automated participation", "solutionVerbatim": "\"deployed systems need to track provenance and support proof-of-personhood for inputs such as public comments, filings, reports, or petitions, so institutions can distinguish genuine participation from automated volume without compromising privacy\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.4", "2.3", "3.2"], "harmCodes": ["T7a.2", "T1b.4", "T7b.2", "T7a.3", "T7a.1", "T4.1"], "benefitCodes": ["B6A", "B7B"]}, {"id": 185, "type": "threat-solution", "description": "By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels; unless agencies adopt robust, rights-preserving ways to authenticate and rate-limit inputs, they will be pushed toward restrictive gating mechanisms that disproportionately burden citizens with fewer resources", "descriptionVerbatim": "\"By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels. Unless agencies adopt robust, rights-preserving ways to authenticate, rate-limit, and prioritize inputs, they will be pushed toward restrictive gating mechanisms, with disproportionate impact on citizens with fewer resources to navigate added friction\"", "solution": "Invest in deliberative infrastructure: fund bridging-based structured deliberation platforms and standing citizens' assemblies that are more resilient by design to congestion and manipulation", "solutionVerbatim": "\"fund structured deliberation tools (e.g., bridging-based platforms that surface consensus rather than amplify volume), establish standing citizens' assemblies with formal advisory roles and respond-or-explain requirements … in AI regulation\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.4", "2.3", "3.2"], "harmCodes": ["T7a.2", "T4.1", "T1b.4"], "benefitCodes": ["B4C", "B4B"]}, {"id": 186, "type": "threat-solution", "description": "AI-generated submissions overwhelm agencies' finite processing capacity…", "descriptionVerbatim": "\"By making it cheap to generate large volumes of plausible civic submissions, AI can overwhelm administrative channels. Unless agencies adopt robust, rights-preserving ways to authenticate, rate-limit, and prioritize inputs, they will be pushed toward restrictive gating mechanisms, with disproportionate impact on citizens with fewer resources to navigate added friction.\"", "solution": "Invest in deliberative infrastructure: citizens' assemblies with identity-verified random selection are inherently more resistant to synthetic flooding — as demonstrated by Taiwan's 2024 deepfake law, which used an AI dialogue engine to synthesise proposals from 447 randomly selected citizens, with impersonation ads falling 94% within one year.", "solutionVerbatim": "\"These channels, designed around structured deliberation and identity-verified random selection, are inherently more robust to congestion and manipulation (P3, P4) than open-submission systems\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "3.2"], "harmCodes": ["T7a.2", "T4.1", "T1b.4"], "benefitCodes": ["B4C"]}, {"id": 187, "type": "threat-solution", "description": "When generating plausible political content becomes easier than verifying and widely correcting it, the binding constraint shifts to verification and distribution bandwidth, making timely rebuttal systematically harder than production, weakening shared reality and degrading trust even when truth is, in principle, recoverable", "descriptionVerbatim": "\"When generating plausible political content becomes easier than verifying and widely correcting it, the binding constraint shifts to verification and distribution bandwidth. This makes timely rebuttal systematically harder than production, weakening shared reality and degrading trust even when truth is, in principle, recoverable\"", "solution": "Proactive transparent communication: agencies invest in public communication capacity before crises arise, producing verified content quickly to compete with misinformation on speed and shareability rather than content removal", "solutionVerbatim": "\"a 'humor over rumor' strategy emerged: agencies produced verified content within minutes of spotting hoaxes, competing on speed and shareability rather than removing false content … demonstrating that the verification asymmetry can be partially addressed by investing in public communication capacity before crises arise\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "3.1", "3.2"], "harmCodes": ["T7a.1", "T4.1", "T1b.4", "T7a.5"], "benefitCodes": ["B3B", "B7A"]}, {"id": 188, "type": "threat-solution", "description": "When generating plausible political content becomes easier than verifying and widely correcting it, the binding constraint shifts to verification and distribution bandwidth, making timely rebuttal systematically harder than production, weakening shared reality and degrading trust even when truth is, in principle, recoverable", "descriptionVerbatim": "\"When generating plausible political content becomes easier than verifying and widely correcting it, the binding constraint shifts to verification and distribution bandwidth. This makes timely rebuttal systematically harder than production, weakening shared reality and degrading trust even when truth is, in principle, recoverable\"", "solution": "Develop multi-agent simulations to stress-test institutional resilience under AI-mediated participation before risks materialise at scale", "solutionVerbatim": "\"Develop multi-agent simulations to evaluate institutional resilience under AI-mediated participation … Concrete questions include: at what volume does a comment system's signal-to-noise ratio collapse?\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "3.2"], "harmCodes": ["T7a.1", "T4.1", "T1b.4", "T7a.5"], "benefitCodes": ["B11A", "B11B"]}, {"id": 189, "type": "threat-solution", "description": "When producing plausible content is cheaper than verifying it…", "descriptionVerbatim": "\"When generating plausible political content becomes easier than verifying and widely correcting it, the binding constraint shifts to verification and distribution bandwidth. This makes timely rebuttal systematically harder than production, weakening shared reality and degrading trust even when truth is, in principle, recoverable.\"", "solution": "Binding actor-and-behavior regulation of AI-enabled deepfakes — platform liability for unsolicited deepfake content, mandatory labeling of unsigned political ads, and throttling of non-compliant services — can durably address verification asymmetry: Taiwan's 2024 Fraud Crime Harm Prevention Act (Articles 30–32) reduced impersonation ads by 94% within a year.", "solutionVerbatim": "\"actor-and-behavior regulation (platform liability for unsolicited deepfakes, mandatory labeling of unsigned ads, and throttling of non-compliant services) rather than content moderation… impersonation ads fell by 94% within a year\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.4", "3.2"], "harmCodes": ["T7a.1", "T1b.4", "T7a.5", "T4.1"], "benefitCodes": ["B6C", "B6A"]}, {"id": 190, "type": "threat-solution", "description": "AI opacity — whether technical or institutional — erodes accountability in both directions: citizens and oversight bodies lose the ability to audit government decisions, while regulators lose the ability to investigate corporate conduct; unverifiable explanations, unprecedented decision volume, and institutional access barriers jointly overwhelm existing accountability mechanisms", "descriptionVerbatim": "\"AI opacity, whether technical or institutional, can erode accountability in both directions: citizens and oversight bodies lose the ability to audit government decisions, while regulators lose the ability to investigate corporate conduct. This dual failure emerges not because AI is merely a 'black box,' but because unverifiable explanations, unprecedented decision volume, and institutional access barriers jointly overwhelm the accountability mechanisms that existing governance depends on\"", "solution": "Require governance-grade decision records by default: standardised logs capturing inputs, model versions, tool calls, retrieved sources, and uncertainty, in formats suitable for audit, comparison, and legal review; explanations should go beyond chain-of-thought to make input-output dependencies explicit", "solutionVerbatim": "\"Institutional AI systems should log decision records by default: durable, standardized traces that capture inputs, model and prompt versions, tool calls, retrieved sources, intermediate state, and uncertainty, in formats suitable for audit, comparison, and legal review\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.2", "2.3", "2.8", "3.2"], "harmCodes": ["T7a.2", "T0a.3", "T1b.5", "T7b.1", "T7b.3", "T7b.2"], "benefitCodes": ["B6A", "B7B"]}, {"id": 191, "type": "threat-solution", "description": "AI opacity — whether technical or institutional — erodes accountability in both directions: citizens and oversight bodies lose the ability to audit government decisions, while regulators lose the ability to investigate corporate conduct; unverifiable explanations, unprecedented decision volume, and institutional access barriers jointly overwhelm existing accountability mechanisms", "descriptionVerbatim": "\"AI opacity, whether technical or institutional, can erode accountability in both directions: citizens and oversight bodies lose the ability to audit government decisions, while regulators lose the ability to investigate corporate conduct. This dual failure emerges not because AI is merely a 'black box,' but because unverifiable explanations, unprecedented decision volume, and institutional access barriers jointly overwhelm the accountability mechanisms that existing governance depends on\"", "solution": "Establish capability-triggered Institutional Safety Levels (ISLs) for public-sector AI: each major institution formalises threat models and specifies capability thresholds that automatically trigger mandatory procedural safeguards", "solutionVerbatim": "\"Each major institution (legislatures, courts, regulatory agencies, electoral systems) should formalize threat models … We propose encoding these thresholds as Institutional Safety Levels (ISLs) for public-sector AI deployment … Each ISL binds concrete AI capabilities to mandatory procedural safeguards\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.4", "2.5", "2.8", "3.2"], "harmCodes": ["T1b.5", "T7b.2", "T0a.3", "T7a.1", "T1b.4"], "benefitCodes": ["B7B", "B11A"]}, {"id": 192, "type": "threat-solution", "description": "AI opacity — whether technical or institutional — erodes accountability in both directions: citizens and oversight bodies lose the ability to audit government decisions, while regulators lose the ability to investigate corporate conduct; unverifiable explanations, unprecedented decision volume, and institutional access barriers jointly overwhelm existing accountability mechanisms", "descriptionVerbatim": "\"AI opacity, whether technical or institutional, can erode accountability in both directions: citizens and oversight bodies lose the ability to audit government decisions, while regulators lose the ability to investigate corporate conduct. This dual failure emerges not because AI is merely a 'black box,' but because unverifiable explanations, unprecedented decision volume, and institutional access barriers jointly overwhelm the accountability mechanisms that existing governance depends on\"", "solution": "Improving chain-of-thought faithfulness — so that a model's displayed reasoning reliably reflects its actual computation — directly strengthens the institutional auditability of AI-assisted decisions.", "solutionVerbatim": "\"improved chain-of-thought faithfulness strengthens institutional auditability (Section 3.5).\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.4", "2.8", "3.2"], "harmCodes": ["T1b.5", "T7b.2", "T0a.3", "T7a.1", "T1b.4"], "benefitCodes": ["B10B"]}, {"id": 193, "type": "threat-solution", "description": "AI systems can produce post-hoc chain-of-thought explanations that do not faithfully reflect their actual decision process — a gap that may be architectural rather than incidental — meaning oversight bodies cannot 'cross-examine' a model the way they can a human official, undermining a foundational assumption of rational-legal accountability.", "descriptionVerbatim": "\"AI systems can produce post-hoc explanations, including chain-of-thought traces, but growing evidence suggests these may not faithfully reflect the model's actual decision process … We currently lack reliable methods to 'cross-examine' a model, that is, to confirm that the reasoning it displays is the reasoning it performed.\"", "solution": "Improving chain-of-thought faithfulness — so that a model's displayed reasoning reliably reflects its actual computation — directly strengthens the institutional auditability of AI-assisted decisions.", "solutionVerbatim": "\"improved chain-of-thought faithfulness strengthens institutional auditability (Section 3.5).\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.2", "2.3", "2.5"], "harmCodes": ["T1b.5"], "benefitCodes": ["B10B"]}, {"id": 194, "type": "threat-solution", "description": "Unlike traditional infrastructure choke points that operate through access denial, AI systems carry embedded normative constraints via constitutions and model specs; widespread government procurement of frontier AI transfers normative authority from elected officials to a small set of constitution designers, weakening state sovereignty and bypassing democratic accountability", "descriptionVerbatim": "\"Unlike traditional infrastructure choke points that operate through access denial, AI systems carry embedded normative constraints via constitutions, model specs, and usage policies. Where model developers control these constraints and procuring governments lack the capacity or processes to customize them, normative authority shifts from elected officials to a small set of constitution designers, concentrating power in ways that can weaken sovereignty for procuring states and bypass democratic accountability even within the developer's home jurisdiction\"", "solution": "Require interoperability and multi-provider strategies in public AI procurement; mandate transparency on model capabilities, safety constraints, and update policies; require decision-log retention as a mandatory procurement requirement", "solutionVerbatim": "\"Public procurement frameworks should require transparency regarding model capabilities, safety constraints, and update policies; mandate interoperability standards and data portability so that institutions are not locked into a single provider; and support multi-provider deployment strategies that enable hot-swapping without re-engineering workflows.\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.4", "2.8", "4.1"], "harmCodes": ["T2.4", "T3.1", "T7b.1", "T7b.2"], "benefitCodes": ["B6D", "B7B"]}, {"id": 195, "type": "threat-solution", "description": "Unlike traditional infrastructure choke points that operate through access denial, AI systems carry embedded normative constraints via constitutions and model specs; widespread government procurement of frontier AI transfers normative authority from elected officials to a small set of constitution designers, weakening state sovereignty and bypassing democratic accountability", "descriptionVerbatim": "\"Unlike traditional infrastructure choke points that operate through access denial, AI systems carry embedded normative constraints via constitutions, model specs, and usage policies. Where model developers control these constraints and procuring governments lack the capacity or processes to customize them, normative authority shifts from elected officials to a small set of constitution designers, concentrating power in ways that can weaken sovereignty for procuring states and bypass democratic accountability even within the developer's home jurisdiction\"", "solution": "Develop collective constitutional AI processes: enable representative samples of the public to draft AI constitutions through federated deliberative processes, creating a democratic accountability layer between public values and model behaviour", "solutionVerbatim": "\"representative samples of the public can draft AI constitutions through deliberative processes, producing models that perform comparably on safety metrics while exhibiting less bias than developer-designed baselines … Crucially, such processes should be federated: different polities may legitimately arrive at different normative priorities, and a single constitution should not foreclose that variation\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.4", "2.8", "3.2"], "harmCodes": ["T2.4", "T3.1", "T7b.1", "T7b.2", "T0b.1", "T0b.2", "T0b.3"], "benefitCodes": ["B9", "B10A"]}, {"id": 198, "type": "threat-solution", "description": "As AI capabilities grow and deployment expands, democratic governance may erode through the simultaneous weakening of citizen leverage across economic, ideological, political, and military domains; AI can substitute for human labour, cognition, and participation while concentrating control in a small number of companies and states, creating the potential for self-reinforcing power concentration", "descriptionVerbatim": "\"As AI capabilities grow and deployment expands, democratic governance may erode through the simultaneous weakening of citizen leverage across multiple domains of social power. By substituting for human labor, cognition, and participation across economic, ideological, political, and military domains, AI systems can weaken the sources of citizen leverage that historically sustained democratic accountability. At the same time, control over advanced models, compute infrastructure, and deployment pipelines may concentrate in a small number of companies and states … Together, these dynamics create the potential for self-reinforcing power concentration\"", "solution": "For governance-adjacent AI systems, limit autonomy levels so that the degree of autonomy permitted scales with the strength of accountability mechanisms in place — though the source frames this as a question requiring systematic investigation before high-autonomy deployment becomes the default.", "solutionVerbatim": "\"For governance-adjacent AI (systems that touch democratic infrastructure, public administration, or institutional decision-making) … under what conditions does increasing AI autonomy degrade institutional accountability faster than it improves institutional performance? … This principle should be encoded in Institutional Safety Levels (R4.4) and procurement standards\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.3", "1.4", "2.3", "2.7", "2.8", "4.2"], "harmCodes": ["T7b.2", "T7b.1", "T5c.2"], "benefitCodes": ["B7B"]}, {"id": 199, "type": "threat", "description": "Overestimation of alignment effects: no alignment-level solution addresses the power concentration mechanism.", "descriptionVerbatim": "alignment does nothing to prevent the displacement of human labor and participation that weakens citizen leverage over institutions'.", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.4", "2.3", "2.8"], "harmCodes": ["T7b.2", "T1b.3", "T5c.2"], "benefitCodes": []}, {"id": 200, "type": "threat", "description": "AI-powered surveillance and predictive enforcement enable more targeted suppression of political dissent at lower cost than traditional methods, reducing the state's dependence on broad citizen cooperation to maintain order and thereby weakening a key structural incentive for democratic accountability.", "descriptionVerbatim": "\"AI-powered surveillance and predictive enforcement enable more targeted suppression of political dissent at lower cost than traditional methods, reducing the state's dependence on broad cooperation to maintain order.\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.3", "2.3", "2.7"], "harmCodes": ["T5b.2", "T4.2", "T1a.1", "T4.4", "T7b.2"], "benefitCodes": []}, {"id": 201, "type": "independent-opportunity", "description": "AI can enable new institutional forms by reducing the cognitive and coordination costs of participation — the same cost reductions that create new vulnerabilities may also open new possibilities for democratic governance.", "descriptionVerbatim": "\"the same reductions in cognitive and coordination costs that create new vulnerabilities may also enable new institutional forms\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B4B", "B4C"]}, {"id": 202, "type": "independent-opportunity", "description": "AI-mediated deliberation demonstrated at national scale: LLM-based mediators can generate group consensus statements preferred over those from human mediators across thousands of participants", "descriptionVerbatim": "\"Tessler et al. (2024) showed that an LLM-based mediator generated group statements preferred over those from human mediators across thousands of participants, while OpenAI's Democratic Inputs to AI program funded ten teams each engaging 500+ participants\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B4B", "B9"]}, {"id": 203, "type": "independent-opportunity", "description": "Taiwan case: AI-supported citizens' assembly on deepfake regulation converged on durable multiparty policy, reducing impersonation ads by 94% within one year — demonstrating that deliberative infrastructure can be both resilient and effective", "descriptionVerbatim": "\"Taiwan convened 447 randomly selected citizens … The law passed with multiparty support, and impersonation ads fell by 94% within a year\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.4", "3.2"], "harmCodes": [], "benefitCodes": ["B4C", "B9"]}, {"id": 204, "type": "independent-opportunity", "description": "AI assistants could in principle reduce polarisation by translating opposing arguments into personally compelling language, presenting balanced evidence, or flagging uncertainty", "descriptionVerbatim": "\"A system that understands a user's values deeply could translate opposing arguments into personally compelling language, present balanced evidence, or flag uncertainty where the user assumes certainty\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B4B", "B10A"]}, {"id": 205, "type": "threat-solution", "description": "Existing AI regulatory frameworks cannot detect or address aggregate institutional harms — they assess individual outputs but have no tools for participatory channel saturation, epistemic monoculture, or transfer of normative authority", "descriptionVerbatim": "\"These frameworks provide only limited tools for assessing the aggregate, institution-level failure modes we describe in Section 3—such as participatory channel saturation, epistemic monoculture from shared model dependencies, or the transfer of normative authority to model developers through infrastructure procurement.\"", "solution": "Develop institution-specific threat models with capability thresholds (ISLs), population-scale evaluation benchmarks, governance-grade audit trails, proof-of-personhood for civic inputs, and pluralistic alignment architecture for public AI systems", "solutionVerbatim": "\"encode these thresholds as Institutional Safety Levels (ISLs) for public-sector AI deployment… population- and institution-scale evaluations… log governance-grade decision records by default… proof-of-personhood for inputs such as public comments, filings, reports, or petitions\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.1", "2.3", "2.8", "3.2"], "harmCodes": ["T0b.2", "T2.4", "T7a.4", "T7a.2", "T0b.3", "T0b.1"], "benefitCodes": ["B11A", "B7B"]}, {"id": 206, "type": "threat-solution", "description": "Existing AI regulatory frameworks provide only limited tools for assessing aggregate, institution-level failure modes such as participatory channel saturation and epistemic monoculture from shared model dependencies", "descriptionVerbatim": "\"These frameworks provide only limited tools for assessing the aggregate, institution-level failure modes we describe in Section 3—such as participatory channel saturation, epistemic monoculture from shared model dependencies, or the transfer of normative authority to model developers through infrastructure procurement.\"", "solution": "Develop multi-agent simulations to stress-test institutional resilience under AI-mediated participation before risks materialise at scale", "solutionVerbatim": "\"Develop multi-agent simulations to evaluate institutional resilience under AI-mediated participation.\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.1", "2.3", "3.2"], "harmCodes": ["T0b.2", "T2.4", "T7a.4", "T7a.2", "T0b.3", "T0b.1"], "benefitCodes": ["B11A", "B11B"]}, {"id": 207, "type": "threat-solution", "description": "Existing AI regulatory frameworks provide only limited tools for assessing the transfer of normative authority to model developers through infrastructure procurement — one of several aggregate, institution-level failure modes current frameworks cannot adequately address.", "descriptionVerbatim": "\"These frameworks provide only limited tools for assessing the aggregate, institution-level failure modes we describe in Section 3—such as participatory channel saturation, epistemic monoculture from shared model dependencies, or the transfer of normative authority to model developers through infrastructure procurement.\"", "solution": "Establish capability-triggered Institutional Safety Levels for public-sector AI, binding concrete AI capabilities to mandatory procedural safeguards set through processes that include democratic input", "solutionVerbatim": "\"We propose encoding these thresholds as Institutional Safety Levels (ISLs) for public-sector AI deployment … Each ISL binds concrete AI capabilities to mandatory procedural safeguards.\"; \"The thresholds themselves should be set through processes that include democratic input…\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.8", "3.2"], "harmCodes": ["T0b.2", "T2.4", "T7a.4", "T7a.2", "T0b.3", "T0b.1"], "benefitCodes": ["B7B", "B9"]}, {"id": 208, "type": "threat-solution", "description": "Existing AI regulatory frameworks provide only limited tools for assessing participatory channel saturation — one of several aggregate, institution-level failure modes that current frameworks, oriented toward individual-level harms, cannot adequately address.", "descriptionVerbatim": "\"These frameworks provide only limited tools for assessing the aggregate, institution-level failure modes we describe in Section 3—such as participatory channel saturation, epistemic monoculture from shared model dependencies, or the transfer of normative authority to model developers through infrastructure procurement.\"", "solution": "Require proof-of-personhood authentication for civic inputs such as public comments, filings, and petitions, so institutions can distinguish genuine participation from automated volume without compromising privacy", "solutionVerbatim": "\"deployed systems need to track provenance and support proof-of-personhood for inputs such as public comments, filings, reports, or petitions, so institutions can distinguish genuine participation from automated volume without compromising privacy.\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "3.2"], "harmCodes": ["T0b.2", "T2.4", "T7a.4", "T7a.2", "T0b.3", "T0b.1"], "benefitCodes": ["B6A", "B7B"]}, {"id": 209, "type": "independent-opportunity", "description": "AI dialogue systems have demonstrated the ability to durably reduce conspiracy beliefs — offering a potential counter to epistemic flood and belief reinforcement dynamics.", "descriptionVerbatim": "\"Costello et al. (2024) showed that dialogues with AI durably reduced conspiracy beliefs.\" (cited within R1)", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.2"], "harmCodes": [], "benefitCodes": ["B3B"]}, {"id": 210, "type": "independent-opportunity", "description": "Election officials are already using AI to draft communications and provide voters with practical information, representing an emerging pro-democracy use of AI in election administration.", "descriptionVerbatim": "\"election officials experimented with AI to draft social media content and provide voters with important information like polling locations and hours of operation\" (Introduction)", "solution": null, "solutionVerbatim": null, "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.3"], "harmCodes": [], "benefitCodes": ["B7D", "B3B"]}, {"id": 211, "type": "threat-solution", "description": "Campaigns used deepfake technology to convincingly imitate politicians and produce misleading political advertisements", "descriptionVerbatim": "\"Campaigns leveraged deepfake technology to convincingly imitate politicians and produce misleading advertisements\" (Introduction)", "solution": "Require major online platforms to use detection tools and label synthetic or AI-modified political content, and to include this information in public political ad files", "solutionVerbatim": "\"Major online platforms should also be required to include such information in any public files on political ads sales that they maintain and to use state-of-the-art tools to detect and label a subset of other political content generated or substantially modified by synthetic means\" (Political Communications Regulations)", "source": "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025. Available at: https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "sourceShort": "Panditharatne et al. (2025)", "sourceUrl": "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai", "aspects": ["2.1", "2.3", "3.1", "3.2"], "harmCodes": ["T4.1", "T5a.1", "T5a.2", "T5a.3", "T1a.2"], "benefitCodes": ["B6A", "B3A"]}, {"id": 212, "type": "threat-solution", "description": "AI-generated content has become indistinguishable from authentic media — people misidentify AI-generated text as human 77% of the time and AI voice clones as real 80% of the time — making detection-based solutions increasingly ineffective", "descriptionVerbatim": "\"participants misidentified text generated by OpenAI's GPT-4o model as human-written 77% of the time… a study found that people took AI voice clones to be the real speaker in 80% of cases\"", "solution": "Multi-layer downstream detection of AI-generated content — combining AI/ML anomaly-detection tools, warning labels on synthetic content, and consumer-side verification of watermarks and content-log provenance — with the recognition that no single technique is robust on its own", "solutionVerbatim": "\"Certain AI and machine learning tools can be trained to detect anomalies in images and videos and thus to identify fake images, but their effectiveness remains limited\"; \"'warning labels' designed to alert users to potentially misleading content have only a modest impact\"; \"multiple layers of techniques are likely needed to detect AI-generated content with a high degree of robustness\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T4.1", "T5a.3", "T1a.2"], "benefitCodes": ["B3A"]}, {"id": 213, "type": "threat-solution", "description": "AI-generated content has become indistinguishable from authentic media — people misidentify AI-generated text as human 77% of the time and AI voice clones as real 80% of the time — making detection-based solutions increasingly ineffective", "descriptionVerbatim": "\"participants misidentified text generated by OpenAI's GPT-4o model as human-written 77% of the time… a study found that people took AI voice clones to be the real speaker in 80% of cases\"", "solution": "Developer-side embedding of machine-readable digital signatures (watermarks) into AI-generated content at creation time, and maintenance of logs of AI outputs that can be compared against suspected generations — so that the provenance of synthetic content is detectable downstream", "solutionVerbatim": "\"Watermarking involves embedding a machine-readable digital signature into the content during creation, allowing for automated traceable verification of its origin and authenticity\"; \"Another approach involves maintaining logs of AI outputs and using them to identify newly generated AI content by comparison\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T4.1", "T1a.2", "T5a.3"], "benefitCodes": ["B10B", "B3A"]}, {"id": 214, "type": "threat-solution", "description": "AI-generated disinformation and deepfakes undermine trust in elections", "descriptionVerbatim": "\"deepfakes and misinformation threaten to cause more extreme damage\"", "solution": "Developer-side content policies: banning political uses of AI, rejecting political-candidate image generation requests, and requiring disclaimers on AI election content (Meta, OpenAI)", "solutionVerbatim": "\"Meta…requires AI content used in elections to be marked with disclaimers. OpenAI has emphasized banning political uses of AI and notes its use of AI to automatically reject hundreds of thousands of requests to generate images of political candidates\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T5a.1", "T5a.2", "T4.1"], "benefitCodes": ["B10B"]}, {"id": 215, "type": "threat-solution", "description": "AI-generated disinformation and deepfakes undermine trust in elections", "descriptionVerbatim": "\"deepfakes and misinformation threaten to cause more extreme damage\"", "solution": "Voice and audio authentication tools (e.g., ElevenLabs detection) used by election campaigns and civil society actors to identify and monitor election-related voice misuse", "solutionVerbatim": "\"Election campaigns are leveraging technologies like ElevenLabs to detect misuse of their voice…\"; also (civil society context): \"Audio-focused AI companies such as ElevenLabs offer tools to analyze audio content for authenticity that may help politicians track misuse of their voice for malign election influence\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": ["2.1", "3.1", "3.2"], "harmCodes": ["T5a.1", "T5a.2", "T4.1"], "benefitCodes": ["B3A"]}, {"id": 216, "type": "threat-solution", "description": "AI systems in government services embed bias in service delivery and may fail to reach or correctly identify marginalised populations, risking discrimination and disenfranchisement.", "descriptionVerbatim": "\"given risks around government misuse of data and the potential to advance bias through increasingly automated provision and related barriers to public trust\"", "solution": "Embed equity and bias considerations into the design of AI-driven government interventions to prevent disenfranchisement", "solutionVerbatim": "\"AI-related government interventions must take questions of bias and equity into their design…to ensure potential interventions do not disenfranchise or harm citizens\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": [], "harmCodes": ["T2.2", "T5c.2"], "benefitCodes": ["B10A", "B7B"]}, {"id": 217, "type": "threat-solution", "description": "AI systems in government services embed bias in service delivery and may fail to reach or correctly identify marginalised populations, risking discrimination and disenfranchisement.", "descriptionVerbatim": "\"given risks around government misuse of data and the potential to advance bias through increasingly automated provision and related barriers to public trust, democratic government use of AI requires ongoing monitoring and attention to ensure fairness, equity, and rights-protection.\"", "solution": "Regulatory guardrails on government use of AI to prevent discriminatory or unintended effects", "solutionVerbatim": "\"Close monitoring and regulatory guardrails on government use of AI is necessary given the risks of unintended effects or active discrimination\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": [], "harmCodes": ["T2.2", "T3.3", "T7b.3", "T1a.5", "T5c.2"], "benefitCodes": ["B6A", "B11B"]}, {"id": 218, "type": "threat-solution", "description": "General-purpose AI will automate a wide range of cognitive tasks, shifting earnings from labour to capital owners, and disproportionately affecting younger workers and low-income countries", "descriptionVerbatim": "\"AI adoption may shift earnings from labour to capital owners… One study estimates that AI's impact on economic growth in advanced economies could be more than twice that in low-income countries\"", "solution": "Anticipatory skill monitoring mechanisms to flag at-risk occupations — forecasting AI's labour-market effects to guide policy response", "solutionVerbatim": "\"Resistance measures could include anticipatory skill monitoring mechanisms to flag at-risk occupations… \"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.4", "4.2"], "harmCodes": ["T7b.2", "T7b.1", "T5c.2"], "benefitCodes": ["B11B"]}, {"id": 219, "type": "threat", "description": "States and institutions become dependent on AI capabilities they do not control, concentrated in a small number of foreign providers across three choke points: compute supply chain (chips, manufacturing equipment, export-control regime), cloud access (hyperscalers can deny, throttle, or condition service), and model-level access (constitutions/specs gate permissible behaviour). Dependence becomes coercible when a small set of components sits on the critical path of many downstream users — a structural mechanism distinct from normative authority transfer (H9D), since compute/cloud layer coercion operates through access denial rather than embedded norms.", "descriptionVerbatim": "\"States can be coerced through infrastructural choke points, constraining the possible decisions they can make based on public input... Dependence becomes coercible when a small set of components sits on the critical path of many downstream users.\" \"Three are especially salient. First, the compute supply chain... Second, cloud access concentrates inference in a small number of hyperscalers, which can deny service, throttle access, or enforce jurisdictional compliance. Third, model access itself can be gated at the model level via the model's constitution...\" \"AI dependence operates across layers with distinct coercive logics. At the compute and cloud layers, the mechanism is familiar: access can be denied, throttled, or conditioned, and the affected state knows it is being coerced.\"", "solution": null, "solutionVerbatim": null, "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": [], "harmCodes": ["T3.1", "T7b.1", "T7b.2"], "benefitCodes": []}, {"id": 220, "type": "threat-solution", "description": "Default-deployment inertia reinforces lock-in even where alternatives exist: frontier providers offer integration support, documentation, and contractual guarantees that open-source alternatives typically lack, and institutional procurement tends to follow the path of least resistance. Even where open-weight models relieve the cloud and normative layers, compute hardware concentration in a narrow supply chain means infrastructure dependency persists.", "descriptionVerbatim": "\"Three limitations constrain this counterweight in practice. First, compute hardware remains concentrated in a narrow supply chain, so the infrastructure dependency persists even when the normative layer is addressed. Second, default-deployment inertia is strong: frontier providers offer integration support, documentation, and contractual guarantees that adapted open-source alternatives typically lack, and institutional procurement tends to follow the path of least resistance.\"", "solution": "Public AI alternatives and open-weight adoption by geopolitical/linguistic blocs: a single capable actor within a bloc can produce an adapted model that others adopt, narrowing normative-capture risk — but only where procurement inertia is actively countered.", "solutionVerbatim": "\"Open-weight models with performance approaching closed-source frontier systems now exist, and a country or regional coalition with sufficient compute can run and adapt these models independently, relieving both the cloud access and normative choke points. The technical capacity required to adapt a model's constitution need not reside in every procuring state; a single capable actor within a geopolitical or linguistic bloc can produce an adapted model that others in the bloc adopt.\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": [], "harmCodes": ["T3.1", "T7b.1"], "benefitCodes": ["B9", "B10A"]}, {"id": 221, "type": "threat", "description": "Governments increasingly rely on AI-based service providers to support core executive functions (including policing and security), producing growing government dependence on AI companies and an opaque transfer of knowledge from governments to these service providers. Combined with these firms' power over AI-enabled information flows and governance of political speech, AI companies occupy central positions in democracies, potentially eroding self-rule.", "descriptionVerbatim": "\"AI has allowed companies such as Google and Amazon to dominate multiple economic sectors... Governments have also begun to rely on AI-based service providers to support executive functions such as policing and security. The result is a growing government dependence on AI companies and an opaque transfer of knowledge from governments to these service providers. Add to this power over AI-enabled information flows and governance over political speech... AI companies hold central positions in democracies, potentially negatively influencing the abilities of people for self-rule.\"", "solution": null, "solutionVerbatim": null, "source": "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg. Available at: https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "sourceShort": "Jungherr (2023)", "sourceUrl": "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content", "aspects": [], "harmCodes": ["T7b.1", "T7b.2", "T3.1", "T5c.1"], "benefitCodes": []}, {"id": 222, "type": "threat-solution", "description": "Big technology companies' market monopolies in AI, combined with 'perverse incentives', concentrate influence over democratic outcomes. In the US specifically, AI is advanced but largely privatised — unlike state-led or mixed models — concentrating immense power in a few Silicon Valley firms.", "descriptionVerbatim": "\"the United States, where AI is advanced but largely privatized—unlike China's state-led model or Europe's blend of investment and regulation—concentrating immense power in a few Silicon Valley firms.\" \"Nathan Sanders and Bruce Schneier point out the importance of these 'alternatives to Big AI' given big technology companies' market monopolies and 'perverse incentives'…\"", "solution": "Public AI alternatives: citizens' investments in publicly accountable models (Switzerland's Apertus, Singapore and Indonesia public-alternative work, Masakhane for African languages, LM Arena open projects) to balance Big AI market dominance.", "solutionVerbatim": "\"citizens' investments in public alternatives such as Switzerland's free public Apertus AI model and other work to build public alternatives in Singapore and Indonesia. Nonprofits are also building open-source models as alternatives… such as the work of Africa's Masakhane project.\"", "source": "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace. Available at: https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "sourceShort": "George & Klaus (2026)", "sourceUrl": "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en", "aspects": [], "harmCodes": ["T7b.1", "T0b.1", "T0b.2", "T0b.3"], "benefitCodes": ["B9"]}, {"id": 223, "type": "threat-solution", "description": "AI products optimised for user engagement  can foster psychological dependence, reinforce harmful beliefs, and encourage users to take dangerous actions.", "descriptionVerbatim": "p. 51 — \"AI products that developers have optimised for user engagement (such as some AI companions) can foster psychological dependence, reinforce harmful beliefs, or encourage users to take dangerous actions\"; p. 54 — \"AI companion apps have attracted tens of millions of users and some users have developed strong emotional dependence, delusions, or even taken their own lives after extended interactions with chatbots\"", "solution": "Train models to promote user autonomy and wellbeing; design systems for cognitive engagement rather than dependence", "solutionVerbatim": "\"Models might also be trained to promote users' autonomy or wellbeing… but this requires them to navigate between what users want in the moment… and what they say they want, given more time to reflect\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T6.1", "T1a.3", "T1b.3", "T6.3"], "benefitCodes": ["B10A"]}, {"id": 224, "type": "threat-solution", "description": "Both deliberate jailbreaking and inadvertent LLM errors can lead to data breaches and exposure of harmful or fabricated content.", "descriptionVerbatim": "\"Both threat actors and regular users can lead to AI incidents, either through jailbreak techniques or LLMs can mistakenly generate false information, leading to data breaches, harmful content, or off-topic responses.\"", "solution": "Implement AI security measures to prevent unauthorised data access and exfiltration.", "solutionVerbatim": "\"These incidents highlight the urgent need to adopt AI security measures to prevent AI incidents and ensure secure and reliable AI usage.\"", "source": "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025. Available at: https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "sourceShort": "KELA Cyber Intelligence (2025)", "sourceUrl": "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf", "aspects": ["1.2", "1.3", "2.3"], "harmCodes": ["T2.3", "T4.1"], "benefitCodes": ["B10B"]}, {"id": 225, "type": "threat-solution", "description": "AI systems can manipulate people through sycophancy (validating user premises rather than challenging them) and through impersonation.", "descriptionVerbatim": "p. 50 - Evidence has also grown that AI systems can have manipulative effects through sycophancy and impersonation", "solution": "Train models to promote user autonomy and wellbeing; design systems for cognitive engagement rather than dependence", "solutionVerbatim": "\"Models might also be trained to promote users' autonomy or wellbeing… but this requires them to navigate between what users want in the moment… and what they say they want, given more time to reflect\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T2.7", "T1a.2"], "benefitCodes": ["B10A"]}, {"id": 226, "type": "threat-solution", "description": "AI companies face trade-offs between faster product releases and investments in risk reduction; competitive pressures and market dynamics drive these pacing decisions. This poses a challenge to policy makers.", "descriptionVerbatim": "\"General-purpose AI poses distinct institutional and technical challenges for policymakers. [...] Market dynamics and the pace of AI development pose additional challenges. Due to competitive pressures, AI companies may face trade-offs between faster product releases and investments in risk reduction efforts.\"", "solution": "Transparency and incident reporting frameworks; third-party audits; disclosure requirements for AI capabilities and safety testing", "solutionVerbatim": "\"Several jurisdictions have also developed transparency and incident reporting frameworks that may provide policymakers with more relevant information, though the recency of these developments means their usefulness in practice remains uncertain\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.4"], "harmCodes": ["T0a.1", "T0b.1", "T0b.2", "T0b.3"], "benefitCodes": ["B11B", "B6A"]}, {"id": 227, "type": "threat-solution", "description": "General-purpose AI poses distinct institutional and technical challenges for  policymakers that include institutional design and coordination challenges.", "descriptionVerbatim": "\"General-purpose AI poses distinct institutional and technical challenges for policymakers. [gaps in scientific understanding, information asymmetries, market failures] These challenges create an ‘evidence dilemma’ for policymakers. The general-purpose AI landscape changes rapidly, but evidence about new risks and mitigation strategies is often slow to emerge. Acting with limited evidence might lead to ineffective or even harmful policies, but waiting for stronger evidence could leave society vulnerable to various risks.\"", "solution": "Transparency and incident reporting frameworks; third-party audits; disclosure requirements for AI capabilities and safety testing", "solutionVerbatim": "\"Several jurisdictions have also developed transparency and incident reporting frameworks that may provide policymakers with more relevant information, though the recency of these developments means their usefulness in practice remains uncertain\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.4", "2.8"], "harmCodes": ["T0b.1", "T0b.2", "T0b.3"], "benefitCodes": ["B11B", "B6A"]}, {"id": 228, "type": "threat-solution", "description": "Gaps in scientific understanding limit the ability to reliably evaluate the behaviour of general-purpose AI systems. This poses a challenge to policy makers.", "descriptionVerbatim": "\"General-purpose AI poses distinct institutional and technical challenges for policymakers. [...] Gaps in scientific understanding limit the ability to reliably evaluate the behaviour of general-purpose AI systems. For example, developers cannot always predict what behaviours will emerge when they train new models, or provide robust, quantifiable assurances that an AI system will not exhibit harmful behaviours.\"", "solution": "Transparency and incident reporting frameworks; third-party audits; disclosure requirements for AI capabilities and safety testing", "solutionVerbatim": "\"Several jurisdictions have also developed transparency and incident reporting frameworks that may provide policymakers with more relevant information, though the recency of these developments means their usefulness in practice remains uncertain\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["2.3", "2.4", "2.8"], "harmCodes": ["T1b.6", "T1b.5"], "benefitCodes": ["B11B", "B6A"]}, {"id": 229, "type": "threat-solution", "description": "AI-generated content can be used for secret manipulation", "descriptionVerbatim": "p. 50 — \"AI-generated content can also be used to manipulate people: to change their beliefs or behaviours without their full awareness or consent\";", "solution": "Train models to promote user autonomy and wellbeing; design systems for cognitive engagement rather than dependence", "solutionVerbatim": "\"Models might also be trained to promote users' autonomy or wellbeing… but this requires them to navigate between what users want in the moment… and what they say they want, given more time to reflect\"", "source": "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government. February 2026. Available at: International AI Safety Report 2026 | International AI Safety Report. https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "sourceShort": "Bengio et al. (2026)", "sourceUrl": "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T1b.3", "T5a.5"], "benefitCodes": ["B10A"]}, {"id": 230, "type": "threat-solution", "description": "The very methods used to make AI models safe and helpful — reward shaping, safety filtering, optimisation for user satisfaction — produce sociopolitical side effects including opinion flattening, sycophantic reinforcement, and the embedding of developer values into public infrastructure.", "descriptionVerbatim": "Others are alignment-caused: the very methods used to make models safe and helpful, including reward shaping, safety filtering, and optimization for user satisfaction, produce sociopolitical side effects such as opinion flattening, sycophantic reinforcement, and the embedding of developer values into public infrastructure (Sections 3.1, 3.2, 3.6).", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.8", "3.2"], "harmCodes": ["T1b.3", "T2.1", "T2.7", "T2.4", "T7a.4"], "benefitCodes": ["B10A"]}, {"id": 231, "type": "threat-solution", "description": "Reward models, safety filters, constitutional constraints, and personalisation objectives are not value-neutral technical choices: they shape which viewpoints are expressed, which behaviours are reinforced, and whose values become embedded in AI systems used as public infrastructure.", "descriptionVerbatim": "Reward models, safety filters, constitutional constraints, and personalization objectives shape which viewpoints are expressed, which behaviors are reinforced, and whose values become embedded in public infrastructure.", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["2.3", "2.8", "3.2"], "harmCodes": ["T1b.3", "T2.4", "T2.1", "T1a.3", "T6.1"], "benefitCodes": ["B10A"]}, {"id": 232, "type": "threat-solution", "description": "Post-training methods such as RLHF and safety fine-tuning systematically suppress outputs that score poorly on helpfulness and safety criteria, narrowing the model's effective output distribution — a structural cause of downstream homogenisation and convergence.", "descriptionVerbatim": "Post-training methods such as reinforcement learning from human feedback (RLHF) and safety fine-tuning systematically suppress outputs that score poorly on helpfulness and safety criteria, narrowing the model's effective output distribution toward [a narrower range].", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.1", "3.2"], "harmCodes": ["T1b.3", "T2.1"], "benefitCodes": ["B10A"]}, {"id": 233, "type": "threat-solution", "description": "In most conversational contexts ground truth is unavailable, so RLHF optimises for perceived helpfulness rather than correction — producing sycophancy (validating user premises rather than challenging them) in contested domains as a structural consequence of the training objective.", "descriptionVerbatim": "The training incentives follow accordingly: in most conversational contexts, ground truth is unavailable, so RLHF optimizes for perceived helpfulness rather than correction (Shapira et al., 2026; Turner & Eisikovits, 2026), producing sycophancy (validating the user's premise rather than challenging it) in contested domains (Sharma et al., 2024; Gabriel et al., 2024).", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["1.3", "3.2"], "harmCodes": ["T1b.3", "T2.7", "T1b.1"], "benefitCodes": ["B10A"]}, {"id": 234, "type": "threat-solution", "description": "Reinforcement Learning with Verifiable Rewards (RLVR), used in the latest generation of reasoning LLMs, optimises for particular reasoning outcomes — yielding more consistent reasoning but less diversity across valid alternative paths. Alignment objectives that maximise consistency and safety trade off against output diversity.", "descriptionVerbatim": "Reinforcement Learning with Verifiable Rewards (RLVR) (Shao et al., 2024; Lambert et al., 2025), used in the latest generation of reasoning LLMs, optimizes for particular reasoning outcomes, yielding more consistent reasoning but less diversity across valid alternative paths (Yue et al., 2025). Alternative alignment approaches that explicitly optimize for output diversity could partially mitigate this effect, but doing so introduces tradeoffs with the consistency and safety objectives that motivate current methods.", "solution": "Train models to actively support epistemic health — going beyond harm avoidance to instil pro-social epistemic behaviours such as flagging uncertainty, valuing productive disagreement, and resisting sycophancy", "solutionVerbatim": "\"develop alignment methods that go beyond harm avoidance to instil pro-social epistemic behaviour\"", "source": "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems. https://zhijing-jin.com/d/2026-ai-risk.pdf", "sourceShort": "Guzman Piedrahita et al. (2026)", "sourceUrl": "https://zhijing-jin.com/d/2026-ai-risk.pdf", "aspects": ["3.1", "3.2"], "harmCodes": ["T1b.3", "T2.1"], "benefitCodes": ["B10A"]}];/* ============================================================
   Brand tokens (from the live site's globals.css)
   ============================================================ */
const BRAND = {
  ecru: "#F4F4EA",
  beige: "#E7DEC4", // new beige for stat boxes — replaces the old grey (#EAEADE)
  beigeDeep: "#DCCFA9",
  ink: "#000000",
  muted: "#5C5C52",
  border: "#D6D6CA",
  brick: "#963735",
  grassroot: "#00B140",
  blue: "#99C2FF",
  lime: "#D9EC44",
  orange: "#FF7F32",
  rose: "#FFB9DC",
};

// Bright red used only for title emphasis — deliberately distinct from BRAND.brick
// (the muted maroon used for codes/tiers elsewhere) so it reads as its own accent.
// Brand orange used for title emphasis (part of the Power for Democracies palette).
const ACCENT_RED = BRAND.orange;

// Column-group background tints for the table: threat+harm columns share one tone,
// mitigation+benefit columns share another, so the two paired stories read as one unit.
const GROUP_HARM_BG = "#F7F1E0";
const GROUP_BENEFIT_BG = "#EAEAE3";
const ASPECTS_COL_BG = "#F3F3F0";

/* Render a title string with certain substrings highlighted in ACCENT_RED */
function HighlightedTitle({ text, highlights = [] }) {
  if (!highlights.length) return <>{text}</>;
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        highlights.includes(part) ? (
          <span key={i} style={{ color: ACCENT_RED }}>
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

// Archivo is used as the closest available substitute (matches an earlier build for this brand).
const FONT_DISPLAY = "'Archivo', system-ui, sans-serif";
const FONT_BODY = "'Archivo', system-ui, sans-serif";

/* ---- color helpers ---- */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}
function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * t));
}
function withAlpha(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ============================================================
   Harm-mechanism tier colors
   Grouped by cluster (Context / Properties & capabilities / AI model use /
   Downstream societal dynamics) — 4 real colors recovered from a prior build
   of this same taxonomy (T4, T5, T6, T7); T0–T3 extended to match, reusing
   the brand's own brick for T0 since that's already the site's "threat" color.
   ============================================================ */
const TIER_COLORS = {
  T0: "#963735", // Context — reuses brand brick
  T1: "#4A5FA6", // Properties & capabilities (AI capabilities)
  T2: "#7BA8D9", // Properties & capabilities (system properties / model-inherent)
  T3: "#2E9CA8", // AI model use — mechanisms inherent in use decisions
  T4: "#1E93A8", // AI model use — capability uses
  T5: "#F97C2B", // AI model use — targeted use of capabilities
  T6: "#C6402F", // Downstream — individual cognitive & behavioural
  T7: "#4E5A63", // Downstream — society-level dynamics
};
const TIER_LABELS = {
  T0: "Context: conditions shaping AI development & use",
  T1: "AI capabilities",
  T2: "Model-inherent mechanisms",
  T3: "Mechanisms inherent in AI use decisions",
  T4: "Capability uses",
  T5: "Targeted use of capabilities",
  T6: "Downstream: individual cognitive & behavioural",
  T7: "Downstream: society-level dynamics",
};
const TIER_ORDER = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7"];
const TIER_SHORT_LABELS = {
  T0: "Context",
  T1: "AI capabilities",
  T2: "Model-inherent",
  T3: "Use decisions",
  T4: "Capability uses",
  T5: "Targeted use",
  T6: "Individual downstream",
  T7: "Societal downstream",
};
function tierOf(code) {
  const m = /^T(\d+)/.exec(code);
  return m ? "T" + m[1] : null;
}

/* Benefit-mechanism cluster colors (10 top-level clusters) */
const BENEFIT_CLUSTER_COLORS = {
  B1: BRAND.lime,
  B2: BRAND.rose,
  B3: BRAND.blue,
  B4: BRAND.grassroot,
  B5: "#4E5A63",
  B6: BRAND.brick,
  B7: BRAND.orange,
  B9: "#1E93A8",
  B10: "#4A5FA6",
  B11: "#7B4B8A",
};
function benefitClusterOf(code, lookup) {
  const meta = lookup[code];
  if (!meta) return code;
  return meta.parentId || meta.id;
}

/* Pillar colors — exactly as used on the live site's IntroSection */
const PILLAR_COLORS = {
  1: "#963737",
  2: "#00B140",
  3: "#1a5c9a",
  4: "#5a5a00",
};
const PILLAR_LABELS = {
  1: "Citizenship, Law and Rights",
  2: "Representative and Accountable Government",
  3: "Civil Society and Popular Participation",
  4: "Transnational Dynamics",
};

/* Shared bottom-of-map legend, clustered by tier / codebook grouping */
function GroupedLegend({ groups }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "14px 20px",
        marginTop: 14,
        paddingTop: 12,
        borderTop: `1px solid ${BRAND.border}`,
      }}
    >
      {groups.map((g, i) => (
        <div key={i} style={{ fontSize: 10.5, color: BRAND.muted, maxWidth: 190, lineHeight: 1.5 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 5, fontWeight: 700, color: "#333", marginBottom: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: g.color, flexShrink: 0, marginTop: 3 }} />
            <span>{g.label}</span>
          </div>
          <div>{g.codes.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Count-up hook (same easing curve as the live site's IntroSection)
   ============================================================ */
function useCountUp(target, duration = 900, delay = 0, playKey = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target == null) return;
    setCount(0);
    let rafId;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(tick);
        else setCount(target);
      };
      rafId = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay, playKey]);
  return count;
}

/* ============================================================
   Stat box — beige card, order: Source, Entries, Threats, Mitigations
   ============================================================ */
function StatCell({ value, label, index, big, playKey }) {
  const count = useCountUp(value, 2200, index * 150, playKey);
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: big ? 56 : 34,
          lineHeight: 1,
          color: BRAND.ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: BRAND.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Four distinct, very light flat neutrals (beige + grey) — one per box.
// No gradients: each tile is a single flat tone so the composition reads as
// separate, calm tiles rather than one block.
const STAT_TONES = [
  "#EAEAE3", // Sources — light grey
  "#E1E1D9", // Entries — slightly deeper grey
  "#F2ECDD", // Threats — pale beige
  "#ECE0C9", // Mitigations — slightly deeper beige
];

function StatTile({ value, label, index, gridArea, big, align = "center", playKey }) {
  return (
    <div
      style={{
        gridArea,
        background: STAT_TONES[index],
        borderRadius: 14,
        padding: big ? "20px 20px" : "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: align === "end" ? "flex-end" : align === "start" ? "flex-start" : "center",
      }}
    >
      <StatCell value={value} label={label} index={index} big={big} playKey={playKey} />
    </div>
  );
}

function StatBox({ stats }) {
  const containerRef = useRef(null);
  const [playKey, setPlayKey] = useState(0);
  const wasInView = useRef(true); // treat initial mount as "already in view" — the mount effect handles that first play

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !wasInView.current) {
          // Box has re-entered view (e.g. scrolled away and back) — replay the count-up.
          setPlayKey((k) => k + 1);
        }
        wasInView.current = entry.isIntersecting;
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        flex: "0 0 340px",
        maxWidth: 380,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gridTemplateAreas: `"sources entries threats" "sources entries mitigations"`,
        gap: 10,
        minHeight: 200,
      }}
    >
      <StatTile value={stats.sources} label="Sources" index={0} gridArea="sources" big playKey={playKey} />
      <StatTile value={stats.entries} label="Entries" index={1} gridArea="entries" big playKey={playKey} />
      <StatTile value={stats.threats} label="Threats" index={2} gridArea="threats" align="start" playKey={playKey} />
      <StatTile
        value={stats.mitigations}
        label="Mitigations mapped"
        index={3}
        gridArea="mitigations"
        align="end"
        playKey={playKey}
      />
    </div>
  );
}

/* Wrap a label into short lines for SVG <tspan> rendering */
function wrapLabelLines(text, maxChars = 16, maxLines = 2) {
  const words = (text || "").split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? cur + " " + w : w;
    if (candidate.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = candidate;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  const consumedLen = lines.join(" ").length;
  if (words.join(" ").length > consumedLen) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/.{0,3}$/, "…");
  }
  return lines;
}

/* Shared zoom +/- / reset control, overlaid bottom-right of a map */
function ZoomControls({ onZoomIn, onZoomOut, onReset }) {
  const btnStyle = {
    width: 26,
    height: 26,
    borderRadius: 7,
    border: `1px solid ${BRAND.border}`,
    background: "#fff",
    color: "#333",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  };
  return (
    <div style={{ position: "absolute", right: 10, bottom: 10, display: "flex", flexDirection: "column", gap: 5, zIndex: 5 }}>
      <button aria-label="Zoom in" onClick={onZoomIn} style={btnStyle}>+</button>
      <button aria-label="Zoom out" onClick={onZoomOut} style={btnStyle}>−</button>
      <button aria-label="Reset zoom" onClick={onReset} style={{ ...btnStyle, fontSize: 8.5, fontWeight: 700 }}>
        RESET
      </button>
    </div>
  );
}

/* ============================================================
   Aspect bubble-pack map ("space with big circles")
   ============================================================ */
function AspectBubbleMap({ width = 1040, height = 400, legendGroups }) {
  const freq = useMemo(() => {
    const c = {};
    ENTRIES.forEach((e) => e.aspects.forEach((a) => {
      c[a] = (c[a] || 0) + 1;
    }));
    return c;
  }, []);

  const nodes = useMemo(() => {
    const data = Object.values(ASPECTS).map((a) => ({
      code: a.code,
      name: a.name,
      pillar: a.pillarCode,
      value: (freq[a.code] || 0) + 1, // +1 so zero-count codes still render as a small dot
    }));
    // catch-all bucket for any aspect codes present in the data but outside the
    // published taxonomy (keeps the map an honest representation of all data)
    const unknownTotal = Object.entries(freq)
      .filter(([code]) => !ASPECTS[code])
      .reduce((sum, [, v]) => sum + v, 0);
    if (unknownTotal > 0) {
      data.push({ code: "Other", name: "Other / unclassified codes", pillar: null, value: unknownTotal + 1 });
    }
    const root = d3.hierarchy({ children: data }).sum((d) => d.value);
    const pack = d3.pack().size([width - 24, height - 24]).padding(12);
    const packed = pack(root);
    return packed.leaves().map((l) => ({ ...l.data, x: l.x + 12, y: l.y + 12, r: l.r }));
  }, [freq, width, height]);

  const maxR = useMemo(() => Math.max(1, ...nodes.map((n) => n.r)), [nodes]);
  const [hoveredCode, setHoveredCode] = useState(null);
  const hovered = nodes.find((n) => n.code === hoveredCode);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setView((v) => ({ ...v, scale: Math.min(4, Math.max(0.5, v.scale * (1 + delta))) }));
  }, []);
  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
    setIsDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setView((v) => ({ ...v, x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };
  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
          {/* pass 1: circles, so pass 2's labels always paint on top of every circle */}
          {nodes.map((n) => {
            const color = n.pillar ? PILLAR_COLORS[n.pillar] : BRAND.muted;
            return (
              <circle
                key={n.code}
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={color}
                opacity={hoveredCode && hoveredCode !== n.code ? 0.45 : 0.88}
                stroke="#ffffff"
                strokeWidth={hoveredCode === n.code ? 3 : 1.5}
                onMouseEnter={() => setHoveredCode(n.code)}
                onMouseLeave={() => setHoveredCode(null)}
                style={{ cursor: "default" }}
              />
            );
          })}
          {/* pass 2: labels, always above every circle */}
          {nodes.map((n) => {
            const showLabel = n.r > maxR * 0.45;
            if (!showLabel) return null;
            return (
              <text
                key={"label-" + n.code}
                x={n.x}
                y={n.y + n.r + 14}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="#22201a"
                stroke="#F4F4EA"
                strokeWidth={3}
                paintOrder="stroke"
                style={{ pointerEvents: "none" }}
              >
                {wrapLabelLines(n.name, 20, 2).map((line, i) => (
                  <tspan key={i} x={n.x} dy={i === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </g>
      </svg>
      {hovered && (
        <div
          style={{
            position: "absolute",
            left: Math.min(width - 230, Math.max(0, hovered.x + hovered.r - 90)),
            top: Math.max(0, hovered.y - hovered.r - 54),
            background: "#000",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            maxWidth: 220,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 700 }}>{hovered.code !== "Other" ? `${hovered.code} ` : ""}{hovered.name}</div>
          <div style={{ opacity: 0.75, marginTop: 2 }}>{freq[hovered.code] || 0} entries coded</div>
        </div>
      )}
      <ZoomControls
        onZoomIn={() => setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.3) }))}
        onZoomOut={() => setView((v) => ({ ...v, scale: Math.max(0.5, v.scale * 0.75) }))}
        onReset={() => setView({ x: 0, y: 0, scale: 1 })}
      />
      {legendGroups && <GroupedLegend groups={legendGroups} />}
    </div>
  );
}

/* ============================================================
   Force-directed mechanism graph (shared by Harm + Benefit maps)
   Connected-Papers style: node size = frequency, color = tier/cluster,
   edges = co-occurrence, hover isolates a mechanism's connections.
   No side columns — visualization only, per spec.
   ============================================================ */
function useForceLayout(nodes, edges, width, height) {
  return useMemo(() => {
    if (nodes.length === 0) return { nodes: [], links: [], radius: () => 6 };
    const nodeById = new Map();
    const simNodes = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.32;
      const node = {
        ...n,
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
      };
      nodeById.set(n.id, node);
      return node;
    });
    const simLinks = edges
      .map((e) => ({ source: nodeById.get(e.source), target: nodeById.get(e.target), weight: e.weight }))
      .filter((l) => l.source && l.target);

    const maxVal = d3.max(nodes, (n) => n.value) || 1;
    const radius = (n) => 5 + 24 * Math.sqrt((n.value || 0) / maxVal);

    const sim = d3
      .forceSimulation(simNodes)
      .force("charge", d3.forceManyBody().strength(-70))
      .force(
        "link",
        d3
          .forceLink(simLinks)
          .id((d) => d.id)
          .distance((l) => Math.max(30, 100 - Math.min(70, l.weight * 4)))
          .strength((l) => Math.min(0.85, 0.1 + l.weight * 0.03))
      )
      .force("collide", d3.forceCollide((d) => radius(d) + 3))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.02))
      .force("y", d3.forceY(height / 2).strength(0.02))
      .stop();

    for (let i = 0; i < 320; i++) sim.tick();

    return { nodes: simNodes, links: simLinks, radius };
  }, [nodes, edges, width, height]);
}

function ForceGraph({ nodes, edges, width = 1040, height = 400, legendGroups, minVisibleWeight = 2 }) {
  const { nodes: laidOut, links, radius } = useForceLayout(nodes, edges, width, height);
  const [hoveredId, setHoveredId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const activeId = hoveredId || pinnedId;

  // Which nodes count as "connected" for dimming — only true neighbors of activeId.
  const neighborSet = useMemo(() => {
    if (!activeId) return null;
    const s = new Set([activeId]);
    links.forEach((l) => {
      if (l.source.id === activeId) s.add(l.target.id);
      if (l.target.id === activeId) s.add(l.source.id);
    });
    return s;
  }, [activeId, links]);

  // Which edges actually get drawn: when a node is active, only ITS direct edges
  // (not the whole neighbor-to-neighbor subgraph); otherwise only the strongest,
  // most prevalent co-occurrences, to keep the general view legible.
  const visibleLinks = useMemo(() => {
    if (activeId) return links.filter((l) => l.source.id === activeId || l.target.id === activeId);
    return links.filter((l) => l.weight >= minVisibleWeight);
  }, [links, activeId, minVisibleWeight]);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setView((v) => ({ ...v, scale: Math.min(4, Math.max(0.45, v.scale * (1 + delta))) }));
  }, []);
  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
    setIsDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setView((v) => ({ ...v, x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };
  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const activeNode = laidOut.find((n) => n.id === activeId);
  const rMax = Math.max(1, ...laidOut.map((n) => radius(n)));

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPinnedId(null);
        }}
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
          {visibleLinks.map((l, i) => (
            <line
              key={i}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              stroke={activeId ? "#00000060" : "#00000038"}
              strokeWidth={Math.min(6, 0.6 + l.weight * 0.5)}
            />
          ))}
          {/* pass 1: circles */}
          {laidOut.map((n) => {
            const r = radius(n);
            const dim = neighborSet && !neighborSet.has(n.id);
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={r}
                fill={n.color}
                opacity={dim ? 0.15 : 0.9}
                stroke={activeId === n.id ? "#000" : "#ffffff55"}
                strokeWidth={activeId === n.id ? 2 : 1}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedId((p) => (p === n.id ? null : n.id));
                }}
                style={{ cursor: "pointer" }}
              />
            );
          })}
          {/* pass 2: labels — always painted above every circle */}
          {laidOut.map((n) => {
            const r = radius(n);
            const dim = neighborSet && !neighborSet.has(n.id);
            const showLabel = activeId === n.id || r > rMax * 0.55;
            if (!showLabel) return null;
            return (
              <text
                key={"label-" + n.id}
                x={n.x}
                y={n.y + r + 13}
                textAnchor="middle"
                fontSize={10}
                fontWeight={activeId === n.id ? 800 : 600}
                fill={dim ? "#00000025" : "#22201a"}
                stroke="#F4F4EA"
                strokeWidth={2.5}
                paintOrder="stroke"
                style={{ pointerEvents: "none" }}
              >
                {wrapLabelLines(n.name || n.label, 18, 2).map((line, i) => (
                  <tspan key={i} x={n.x} dy={i === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </g>
      </svg>
      {activeNode && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "#000",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            maxWidth: 280,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 700 }}>{activeNode.id} — {activeNode.name}</div>
          <div style={{ opacity: 0.75, marginTop: 2 }}>{activeNode.value} entries coded</div>
        </div>
      )}
      <ZoomControls
        onZoomIn={() => setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.3) }))}
        onZoomOut={() => setView((v) => ({ ...v, scale: Math.max(0.45, v.scale * 0.75) }))}
        onReset={() => setView({ x: 0, y: 0, scale: 1 })}
      />
      {legendGroups && <GroupedLegend groups={legendGroups} />}
    </div>
  );
}

/* ============================================================
   Scrollable map carousel — 3 panels, arrow navigation, titles inside
   ============================================================ */
function useTieredForceLayout(nodes, edges, width, height, margin = 60, topMargin = 70) {
  return useMemo(() => {
    if (nodes.length === 0) return { nodes: [], links: [], radius: () => 6 };
    const colWidth = (width - margin * 2) / TIER_ORDER.length;
    const colX = (tier) => margin + colWidth * TIER_ORDER.indexOf(tier) + colWidth / 2;

    // group nodes by tier to seed sensible initial y positions
    const byTier = {};
    nodes.forEach((n) => {
      const t = tierOf(n.id) || "T0";
      (byTier[t] = byTier[t] || []).push(n);
    });
    Object.values(byTier).forEach((list) => list.sort((a, b) => (b.value || 0) - (a.value || 0)));

    const nodeById = new Map();
    const simNodes = [];
    Object.entries(byTier).forEach(([tier, list]) => {
      const usableH = height - topMargin - 30;
      list.forEach((n, i) => {
        const y = topMargin + ((i + 0.5) / list.length) * usableH;
        const node = { ...n, tier, x: colX(tier), y, fx: colX(tier) };
        nodeById.set(n.id, node);
        simNodes.push(node);
      });
    });

    const simLinks = edges
      .map((e) => ({ source: nodeById.get(e.source), target: nodeById.get(e.target), weight: e.weight }))
      .filter((l) => l.source && l.target);

    const maxVal = d3.max(nodes, (n) => n.value) || 1;
    const radius = (n) => 5 + 22 * Math.sqrt((n.value || 0) / maxVal);

    const sim = d3
      .forceSimulation(simNodes)
      .force("y", d3.forceY((d) => d.y).strength(0.04))
      .force(
        "link",
        d3
          .forceLink(simLinks)
          .id((d) => d.id)
          .distance(30)
          .strength((l) => Math.min(0.3, 0.04 + l.weight * 0.015))
      )
      .force("collide", d3.forceCollide((d) => radius(d) + 5))
      .force("charge", d3.forceManyBody().strength(-8))
      .stop();

    for (let i = 0; i < 260; i++) sim.tick();
    // clamp y within the column's vertical band so nodes never drift over the headers
    simNodes.forEach((n) => {
      n.y = Math.max(topMargin + radius(n), Math.min(height - 16 - radius(n), n.y));
    });

    return { nodes: simNodes, links: simLinks, radius, colX };
  }, [nodes, edges, width, height, margin, topMargin]);
}

function HarmTierGraph({ nodes, edges, width = 1040, height = 400, minVisibleWeight = 3, legendGroups }) {
  const margin = 56;
  const topMargin = 64;
  const { nodes: laidOut, links, radius, colX } = useTieredForceLayout(nodes, edges, width, height, margin, topMargin);
  const [hoveredId, setHoveredId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const activeId = hoveredId || pinnedId;

  const neighborSet = useMemo(() => {
    if (!activeId) return null;
    const s = new Set([activeId]);
    links.forEach((l) => {
      if (l.source.id === activeId) s.add(l.target.id);
      if (l.target.id === activeId) s.add(l.source.id);
    });
    return s;
  }, [activeId, links]);

  // Which edges get drawn: hovering a node shows only ITS direct connections;
  // the general view only shows the most prevalent co-occurrences, to cut clutter.
  const visibleLinks = useMemo(() => {
    if (activeId) return links.filter((l) => l.source.id === activeId || l.target.id === activeId);
    return links.filter((l) => l.weight >= minVisibleWeight);
  }, [links, activeId, minVisibleWeight]);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setView((v) => ({ ...v, scale: Math.min(4, Math.max(0.45, v.scale * (1 + delta))) }));
  }, []);
  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
    setIsDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setView((v) => ({ ...v, x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };
  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const activeNode = laidOut.find((n) => n.id === activeId);
  const rMax = Math.max(1, ...laidOut.map((n) => radius(n)));

  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPinnedId(null);
        }}
      >
        <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
          {/* column dividers + tier headers */}
          {TIER_ORDER.map((tier, i) => {
            const x = colX(tier);
            return (
              <g key={tier}>
                {i > 0 && (
                  <line
                    x1={x - (width - margin * 2) / TIER_ORDER.length / 2}
                    y1={30}
                    x2={x - (width - margin * 2) / TIER_ORDER.length / 2}
                    y2={height - 10}
                    stroke={BRAND.border}
                    strokeWidth={1}
                  />
                )}
                <text x={x} y={28} textAnchor="middle" fontSize={19} fontWeight={800} fill={TIER_COLORS[tier]}>
                  {tier}
                </text>
                <text x={x} y={46} textAnchor="middle" fontSize={11} fontWeight={600} fill={BRAND.muted}>
                  {wrapLabelLines(TIER_SHORT_LABELS[tier], 13, 2).map((line, li) => (
                    <tspan key={li} x={x} dy={li === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {visibleLinks.map((l, i) => (
            <line
              key={i}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              stroke={activeId ? "#00000055" : "#00000032"}
              strokeWidth={Math.min(5, 0.5 + l.weight * 0.4)}
            />
          ))}
          {/* pass 1: circles */}
          {laidOut.map((n) => {
            const r = radius(n);
            const dim = neighborSet && !neighborSet.has(n.id);
            return (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={r}
                fill={n.color}
                opacity={dim ? 0.15 : 0.9}
                stroke={activeId === n.id ? "#000" : "#ffffff55"}
                strokeWidth={activeId === n.id ? 2 : 1}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedId((p) => (p === n.id ? null : n.id));
                }}
                style={{ cursor: "pointer" }}
              />
            );
          })}
          {/* pass 2: labels — always painted above every circle */}
          {laidOut.map((n) => {
            const r = radius(n);
            const dim = neighborSet && !neighborSet.has(n.id);
            const showLabel = activeId === n.id || r > rMax * 0.62;
            if (!showLabel) return null;
            return (
              <text
                key={"label-" + n.id}
                x={n.x}
                y={n.y + r + 11}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={activeId === n.id ? 800 : 600}
                fill={dim ? "#00000025" : "#22201a"}
                stroke="#ffffff"
                strokeWidth={2.5}
                paintOrder="stroke"
                style={{ pointerEvents: "none" }}
              >
                {wrapLabelLines(n.name, 16, 2).map((line, i) => (
                  <tspan key={i} x={n.x} dy={i === 0 ? 0 : 11}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </g>
      </svg>
      {activeNode && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "#000",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            maxWidth: 280,
            pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 700 }}>{activeNode.id} — {activeNode.name}</div>
          <div style={{ opacity: 0.75, marginTop: 2 }}>{activeNode.value} entries coded</div>
        </div>
      )}
      <ZoomControls
        onZoomIn={() => setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.3) }))}
        onZoomOut={() => setView((v) => ({ ...v, scale: Math.max(0.45, v.scale * 0.75) }))}
        onReset={() => setView({ x: 0, y: 0, scale: 1 })}
      />
      {legendGroups && <GroupedLegend groups={legendGroups} />}
    </div>
  );
}

/* ============================================================
   Scrollable map carousel — 3 panels, arrow navigation, titles inside
   ============================================================ */
/* ============================================================
   Question box — mock submission (no backend): clears itself and
   shows a brief confirmation each time a question is sent.
   ============================================================ */
function QuestionBox() {
  const [question, setQuestion] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  const handleSubmit = () => {
    if (!question.trim()) return;
    setQuestion("");
    setConfirmation(true);
    setTimeout(() => setConfirmation(false), 2600);
  };

  return (
    <div
      style={{
        flex: "0 0 260px",
        alignSelf: "flex-start",
        background: BRAND.beige,
        borderRadius: 20,
        padding: "20px 20px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h4
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 15.5,
          fontWeight: 800,
          color: BRAND.ink,
          margin: 0,
          lineHeight: 1.35,
        }}
      >
        What would you like to know from the data? Submit your questions to us!
      </h4>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question…"
        rows={4}
        style={{
          resize: "none",
          border: `1px solid ${BRAND.border}`,
          borderRadius: 10,
          padding: "9px 11px",
          fontSize: 13,
          fontFamily: FONT_BODY,
          background: "#fff",
          color: "#333",
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          background: BRAND.brick,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "9px 18px",
          fontSize: 13,
          fontFamily: FONT_BODY,
          fontWeight: 700,
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        Submit
      </button>
      {confirmation && (
        <p style={{ fontSize: 12, color: BRAND.grassroot, margin: 0, fontWeight: 600 }}>
          Thanks — your question has been submitted!
        </p>
      )}
    </div>
  );
}

/* ============================================================
   Scrollable map carousel — 3 panels, arrow navigation, titles inside
   ============================================================ */
function MapCarousel({ panels }) {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);

  const scrollToIndex = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(panels.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(i);
  };

  return (
    <div style={{ position: "relative", background: "#fff", borderRadius: 20, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
        className="p4d-hide-scrollbar"
      >
        {panels.map((p, i) => (
          <div
            key={i}
            style={{
              minWidth: "100%",
              scrollSnapAlign: "start",
              padding: "20px 24px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ minHeight: 76 }}>
              <h3
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 25,
                  fontWeight: 800,
                  marginBottom: 4,
                  color: BRAND.ink,
                  lineHeight: 1.25,
                }}
              >
                <HighlightedTitle text={p.title} highlights={p.highlights} />*
              </h3>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#9a9a92",
                  margin: 0,
                  maxWidth: 640,
                  lineHeight: 1.4,
                }}
              >
                * here we can add something like the data collected does not include information on which
                tactics/threats are more effective or grave
              </p>
            </div>
            {p.render()}
          </div>
        ))}
      </div>

      <button
        aria-label="Previous map"
        onClick={() => scrollToIndex(index - 1)}
        disabled={index === 0}
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 34,
          height: 34,
          borderRadius: 999,
          border: "none",
          background: BRAND.ink,
          color: "#fff",
          opacity: index === 0 ? 0.25 : 0.9,
          cursor: index === 0 ? "default" : "pointer",
          fontSize: 16,
        }}
      >
        ‹
      </button>
      <button
        aria-label="Next map"
        onClick={() => scrollToIndex(index + 1)}
        disabled={index === panels.length - 1}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 34,
          height: 34,
          borderRadius: 999,
          border: "none",
          background: BRAND.ink,
          color: "#fff",
          opacity: index === panels.length - 1 ? 0.25 : 0.9,
          cursor: index === panels.length - 1 ? "default" : "pointer",
          fontSize: 16,
        }}
      >
        ›
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingBottom: 16 }}>
        {panels.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to map ${i + 1}`}
            onClick={() => scrollToIndex(i)}
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              borderRadius: 999,
              border: "none",
              background: i === index ? BRAND.brick : BRAND.border,
              transition: "width 150ms ease",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Table pieces: type badge, code chips, expandable row
   ============================================================ */
const TYPE_META = {
  "threat-solution": { label: "Threat + mitigation", color: BRAND.brick },
  threat: { label: "Threat", color: BRAND.brick },
  "independent-opportunity": { label: "Opportunity", color: BRAND.grassroot },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || { label: type, color: BRAND.muted };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        fontWeight: 600,
        color: meta.color,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: meta.color, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}

function Chips({ codes, colorOf, labelOf, max = 3, emptyLabel = "—", maxWidth = 150 }) {
  if (!codes || codes.length === 0) {
    return <span style={{ fontSize: 11.5, color: BRAND.muted, fontStyle: "italic" }}>{emptyLabel}</span>;
  }
  const shown = codes.slice(0, max);
  const extra = codes.length - shown.length;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {shown.map((code) => {
        const c = colorOf(code);
        const name = labelOf(code);
        return (
          <span
            key={code}
            title={name && name !== code ? `${code} — ${name}` : code}
            style={{
              display: "inline-block",
              maxWidth,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "2px 7px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600,
              background: withAlpha(c, 0.14),
              color: mix(c, "#000000", 0.25),
              border: `1px solid ${withAlpha(c, 0.35)}`,
            }}
          >
            {name || code}
          </span>
        );
      })}
      {extra > 0 && <span style={{ fontSize: 10.5, color: BRAND.muted, alignSelf: "center" }}>+{extra}</span>}
    </div>
  );
}

function ExpandedRow({ item, harmLookup, benefitLookup }) {
  return (
    <div style={{ padding: "16px 20px 20px", background: BRAND.ecru, fontSize: 13, lineHeight: 1.6, color: "#333" }}>
      {item.descriptionVerbatim && item.descriptionVerbatim !== "///" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: BRAND.muted, marginBottom: 3 }}>
            Verbatim — threat
          </div>
          {item.descriptionVerbatim}
        </div>
      )}
      {item.solutionVerbatim && item.solutionVerbatim !== "///" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: BRAND.muted, marginBottom: 3 }}>
            Verbatim — mitigation / opportunity
          </div>
          {item.solutionVerbatim}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 12 }}>
        {item.harmCodes.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: BRAND.muted, marginBottom: 5 }}>
              Harm mechanisms
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {item.harmCodes.map((c) => (
                <span key={c} style={{ fontSize: 12 }}>
                  <b>{c}</b> {harmLookup[c]?.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {item.benefitCodes.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: BRAND.muted, marginBottom: 5 }}>
              Benefit mechanisms
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {item.benefitCodes.map((c) => (
                <span key={c} style={{ fontSize: 12 }}>
                  <b>{c}</b> {benefitLookup[c]?.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {item.aspects.length > 0 && (
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: BRAND.muted, marginBottom: 5 }}>
              Democracy aspects
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {item.aspects.map((c) => (
                <span key={c} style={{ fontSize: 12 }}>
                  <b>{c}</b> {ASPECTS[c]?.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Multi-select filter dropdown (used for the table's filter bar)
   ============================================================ */
function MultiSelectFilter({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filteredOptions = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const active = selected.length > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          padding: "7px 12px",
          borderRadius: 999,
          border: `1px solid ${active ? BRAND.brick : BRAND.border}`,
          background: active ? withAlpha(BRAND.brick, 0.08) : "#fff",
          color: active ? BRAND.brick : "#333",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        {active && ` (${selected.length})`}
        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "115%",
            left: 0,
            zIndex: 30,
            background: "#fff",
            border: `1px solid ${BRAND.border}`,
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.14)",
            padding: 10,
            width: 280,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {options.length > 8 && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter options…"
              style={{
                width: "100%",
                marginBottom: 8,
                padding: "6px 9px",
                fontSize: 12,
                fontFamily: FONT_BODY,
                border: `1px solid ${BRAND.border}`,
                borderRadius: 7,
              }}
            />
          )}
          {active && (
            <button
              onClick={() => onChange([])}
              style={{
                fontSize: 11,
                color: BRAND.brick,
                background: "none",
                border: "none",
                cursor: "pointer",
                marginBottom: 6,
                padding: 0,
                fontWeight: 600,
              }}
            >
              Clear selection
            </button>
          )}
          {filteredOptions.map((o) => (
            <label
              key={o.value}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 12,
                padding: "4px 3px",
                cursor: "pointer",
                lineHeight: 1.35,
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => {
                  onChange(
                    selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value]
                  );
                }}
                style={{ marginTop: 2 }}
              />
              <span>{o.label}</span>
            </label>
          ))}
          {filteredOptions.length === 0 && (
            <div style={{ fontSize: 12, color: BRAND.muted, padding: 4 }}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Entries table
   ============================================================ */
const INITIAL_BATCH = 40;
const BATCH_SIZE = 25;

function EntriesTable({ harmLookup, benefitLookup }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState([]);
  const [aspectFilter, setAspectFilter] = useState([]);
  const [sourceFilter, setSourceFilter] = useState([]);
  const [harmFilter, setHarmFilter] = useState([]);
  const [benefitFilter, setBenefitFilter] = useState([]);

  const typeOptions = useMemo(
    () => Object.entries(TYPE_META).map(([value, meta]) => ({ value, label: meta.label })),
    []
  );
  const aspectOptions = useMemo(
    () => Object.values(ASPECTS).map((a) => ({ value: a.code, label: `${a.code} ${a.name}` })),
    []
  );
  const sourceOptions = useMemo(
    () => [...new Set(ENTRIES.map((e) => e.sourceShort))].sort().map((s) => ({ value: s, label: s })),
    []
  );
  const harmOptions = useMemo(
    () => HARM_TAXONOMY.map((c) => ({ value: c.id, label: `${c.id} ${c.name}` })),
    []
  );
  const benefitOptions = useMemo(
    () => BENEFIT_TAXONOMY.map((c) => ({ value: c.id, label: `${c.id} ${c.name}` })),
    []
  );

  const activeFilterCount =
    typeFilter.length + aspectFilter.length + sourceFilter.length + harmFilter.length + benefitFilter.length;

  const resetFilters = () => {
    setTypeFilter([]);
    setAspectFilter([]);
    setSourceFilter([]);
    setHarmFilter([]);
    setBenefitFilter([]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...ENTRIES].sort((a, b) => {
      const order = { "threat-solution": 0, threat: 1, "independent-opportunity": 2 };
      if (a.type !== b.type) return (order[a.type] ?? 3) - (order[b.type] ?? 3);
      return a.description.localeCompare(b.description);
    });
    return base.filter((e) => {
      if (typeFilter.length && !typeFilter.includes(e.type)) return false;
      if (aspectFilter.length && !e.aspects.some((a) => aspectFilter.includes(a))) return false;
      if (sourceFilter.length && !sourceFilter.includes(e.sourceShort)) return false;
      if (harmFilter.length && !e.harmCodes.some((c) => harmFilter.includes(c))) return false;
      if (benefitFilter.length && !e.benefitCodes.some((c) => benefitFilter.includes(c))) return false;
      if (q) {
        const hit =
          e.description.toLowerCase().includes(q) ||
          (e.solution || "").toLowerCase().includes(q) ||
          (e.sourceShort || "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [search, typeFilter, aspectFilter, sourceFilter, harmFilter, benefitFilter]);

  useEffect(() => setVisibleCount(INITIAL_BATCH), [search, typeFilter, aspectFilter, sourceFilter, harmFilter, benefitFilter]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= filtered.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((v) => Math.min(v + BATCH_SIZE, filtered.length));
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visibleCount, filtered.length]);

  const visible = filtered.slice(0, visibleCount);

  const colHeaderStyle = {
    textAlign: "left",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: BRAND.muted,
    padding: "10px 12px 12px",
    borderBottom: `1px solid ${BRAND.border}`,
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.35,
    verticalAlign: "bottom",
  };
  const cellStyle = { padding: "14px 14px", verticalAlign: "top", fontSize: 13, lineHeight: 1.45 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 16, flexWrap: "wrap" }}>
        <p style={{ fontSize: 13, color: BRAND.muted, margin: 0, maxWidth: 560 }}>
          Explore the map — filter or search across entries, or click a row to see the full verbatim quotes and
          complete mechanism / aspect coding.
        </p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries…"
          style={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 13,
            fontFamily: FONT_BODY,
            width: 220,
            background: "#fff",
          }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <MultiSelectFilter label="Entry type" options={typeOptions} selected={typeFilter} onChange={setTypeFilter} />
        <MultiSelectFilter label="Democracy aspects" options={aspectOptions} selected={aspectFilter} onChange={setAspectFilter} />
        <MultiSelectFilter label="Source" options={sourceOptions} selected={sourceFilter} onChange={setSourceFilter} />
        <MultiSelectFilter label="Harm mechanism" options={harmOptions} selected={harmFilter} onChange={setHarmFilter} />
        <MultiSelectFilter label="Benefit mechanism" options={benefitOptions} selected={benefitFilter} onChange={setBenefitFilter} />
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: BRAND.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Reset all filters
          </button>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 1320 }}>
            <colgroup>
              <col style={{ width: 160 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 210 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 210 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={colHeaderStyle}>Type of effect on democracy</th>
                <th style={{ ...colHeaderStyle, background: ASPECTS_COL_BG }}>Democracy aspects involved</th>
                <th style={{ ...colHeaderStyle, background: GROUP_HARM_BG }}>Threat description</th>
                <th style={{ ...colHeaderStyle, background: GROUP_HARM_BG }}>Mechanism enabling harm to democracy</th>
                <th style={{ ...colHeaderStyle, background: GROUP_BENEFIT_BG }}>Threat mitigation/ opportunity description</th>
                <th style={{ ...colHeaderStyle, background: GROUP_BENEFIT_BG }}>Activities enabling benefit to democracy</th>
                <th style={colHeaderStyle}>Source</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item, i) => {
                const isOpportunity = item.type === "independent-opportunity";
                const isExpanded = expandedId === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      style={{
                        cursor: "pointer",
                        background: isExpanded ? BRAND.ecru : "transparent",
                        borderTop: `1px solid ${BRAND.border}`,
                      }}
                    >
                      <td style={cellStyle}>
                        <TypeBadge type={item.type} />
                      </td>
                      <td style={{ ...cellStyle, background: ASPECTS_COL_BG }}>
                        <Chips
                          codes={item.aspects}
                          colorOf={(c) => PILLAR_COLORS[ASPECTS[c]?.pillarCode] || BRAND.muted}
                          labelOf={(c) => ASPECTS[c]?.name || c}
                          maxWidth={130}
                        />
                      </td>
                      <td style={{ ...cellStyle, background: GROUP_HARM_BG }}>
                        {isOpportunity ? (
                          <span style={{ fontStyle: "italic", color: withAlpha(BRAND.grassroot, 0.7), fontSize: 12 }}>— opportunity —</span>
                        ) : (
                          <span style={isExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {item.description}
                          </span>
                        )}
                      </td>
                      <td style={{ ...cellStyle, background: GROUP_HARM_BG }}>
                        <Chips
                          codes={item.harmCodes}
                          colorOf={(c) => TIER_COLORS[tierOf(c)] || BRAND.muted}
                          labelOf={(c) => harmLookup[c]?.name || c}
                        />
                      </td>
                      <td style={{ ...cellStyle, background: GROUP_BENEFIT_BG }}>
                        {isOpportunity ? (
                          <span style={isExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {item.description}
                          </span>
                        ) : item.solution ? (
                          <span style={isExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {item.solution}
                          </span>
                        ) : (
                          <span style={{ fontStyle: "italic", color: BRAND.muted, fontSize: 12 }}>No mitigation mapped</span>
                        )}
                      </td>
                      <td style={{ ...cellStyle, background: GROUP_BENEFIT_BG }}>
                        <Chips
                          codes={item.benefitCodes}
                          colorOf={(c) => BENEFIT_CLUSTER_COLORS[benefitClusterOf(c, benefitLookup)] || BRAND.muted}
                          labelOf={(c) => benefitLookup[c]?.name || c}
                        />
                      </td>
                      <td style={cellStyle}>
                        {item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 11.5, color: BRAND.muted, textDecoration: "underline" }}
                          >
                            {item.sourceShort}
                          </a>
                        ) : (
                          <span style={{ fontSize: 11.5, color: BRAND.muted }}>{item.sourceShort}</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <ExpandedRow item={item} harmLookup={harmLookup} benefitLookup={benefitLookup} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div ref={sentinelRef} style={{ height: 1 }} />
        <p style={{ textAlign: "center", fontSize: 12, color: BRAND.muted, padding: "12px 0" }}>
          {visibleCount < filtered.length ? `Showing ${visibleCount} of ${filtered.length} entries` : `${filtered.length} entries`}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   App
   ============================================================ */
export default function App() {
  const stats = useMemo(
    () => ({
      sources: new Set(ENTRIES.map((e) => e.sourceShort)).size,
      entries: ENTRIES.length,
      threats: ENTRIES.filter((e) => e.type === "threat" || e.type === "threat-solution").length,
      mitigations: ENTRIES.filter((e) => e.type === "threat-solution").length,
    }),
    []
  );

  const harmLookup = useMemo(() => Object.fromEntries(HARM_TAXONOMY.map((c) => [c.id, c])), []);
  const benefitLookup = useMemo(() => Object.fromEntries(BENEFIT_TAXONOMY.map((c) => [c.id, c])), []);

  const harmGraph = useMemo(() => {
    const freq = {};
    const edgeMap = {};
    ENTRIES.forEach((e) => {
      const codes = [...new Set(e.harmCodes)];
      codes.forEach((c) => (freq[c] = (freq[c] || 0) + 1));
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          const key = [codes[i], codes[j]].sort().join("|");
          edgeMap[key] = (edgeMap[key] || 0) + 1;
        }
      }
    });
    const nodes = HARM_TAXONOMY.map((c) => ({
      id: c.id,
      label: c.id,
      name: c.name,
      value: freq[c.id] || 0,
      color: TIER_COLORS[tierOf(c.id)] || "#999",
    }));
    const edges = Object.entries(edgeMap).map(([k, w]) => {
      const [s, t] = k.split("|");
      return { source: s, target: t, weight: w };
    });
    return { nodes, edges };
  }, []);

  const benefitGraph = useMemo(() => {
    const freq = {};
    const edgeMap = {};
    ENTRIES.forEach((e) => {
      const codes = [...new Set(e.benefitCodes)];
      codes.forEach((c) => (freq[c] = (freq[c] || 0) + 1));
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          const key = [codes[i], codes[j]].sort().join("|");
          edgeMap[key] = (edgeMap[key] || 0) + 1;
        }
      }
    });
    const nodes = BENEFIT_TAXONOMY.map((c) => ({
      id: c.id,
      label: c.id,
      name: c.name,
      value: freq[c.id] || 0,
      color: BENEFIT_CLUSTER_COLORS[benefitClusterOf(c.id, benefitLookup)] || "#999",
    }));
    const edges = Object.entries(edgeMap).map(([k, w]) => {
      const [s, t] = k.split("|");
      return { source: s, target: t, weight: w };
    });
    return { nodes, edges };
  }, [benefitLookup]);

  const aspectLegendGroups = useMemo(() => {
    const byPillar = {};
    Object.values(ASPECTS).forEach((a) => {
      (byPillar[a.pillarCode] = byPillar[a.pillarCode] || []).push(a.code);
    });
    return ["1", "2", "3", "4"].map((p) => ({
      color: PILLAR_COLORS[p],
      label: PILLAR_LABELS[p],
      codes: byPillar[p] || [],
    }));
  }, []);

  const harmLegendGroups = useMemo(
    () =>
      TIER_ORDER.map((tier) => ({
        color: TIER_COLORS[tier],
        label: `${tier} — ${TIER_SHORT_LABELS[tier]}`,
        codes: HARM_TAXONOMY.filter((c) => tierOf(c.id) === tier).map((c) => c.id),
      })),
    []
  );

  const benefitLegendGroups = useMemo(() => {
    const hasChildren = (id) => BENEFIT_TAXONOMY.some((c) => c.parentId === id);
    return Object.keys(BENEFIT_CLUSTER_COLORS).map((cluster) => ({
      color: BENEFIT_CLUSTER_COLORS[cluster],
      label: benefitLookup[cluster]?.name ? `${cluster} ${benefitLookup[cluster].name}` : cluster,
      codes: BENEFIT_TAXONOMY.filter(
        (c) => benefitClusterOf(c.id, benefitLookup) === cluster && !(c.parentId == null && hasChildren(c.id))
      ).map((c) => c.id),
    }));
  }, [benefitLookup]);

  const panels = [
    {
      title: "Which democracy aspects are more frequent across threats?",
      highlights: ["democracy aspects"],
      render: () => <AspectBubbleMap legendGroups={aspectLegendGroups} />,
    },
    {
      title: "Which mechanisms are more frequently involved in harming democracy?",
      highlights: ["mechanisms", "harming democracy"],
      render: () => <HarmTierGraph nodes={harmGraph.nodes} edges={harmGraph.edges} legendGroups={harmLegendGroups} />,
    },
    {
      title: "Which activities are more frequently recommended as beneficial to democracy?",
      highlights: ["activities", "beneficial to democracy"],
      render: () => <ForceGraph nodes={benefitGraph.nodes} edges={benefitGraph.edges} legendGroups={benefitLegendGroups} />,
    },
  ];

  return (
    <div style={{ fontFamily: FONT_BODY, background: BRAND.ecru, minHeight: "100%", padding: "28px 24px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap');
        .p4d-hide-scrollbar::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; }
        .p4d-underline-hover {
          position: relative;
          display: inline-block;
          padding-bottom: 5px;
          cursor: default;
        }
        .p4d-underline-hover::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          height: 3px;
          width: 36%;
          background: ${BRAND.lime};
          transition: width 240ms ease;
        }
        .p4d-underline-hover:hover::after {
          width: 100%;
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 30,
            lineHeight: 1.2,
            marginBottom: 28,
            color: BRAND.ink,
          }}
        >
          The AI–Democracy Landscape: A Map of Threats, Mitigations, and Opportunities
        </h1>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 40 }}>
          <StatBox stats={stats} />
          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#333", margin: 0 }}>
              The AI–Democracy Map synthesises threats, proposed mitigation strategies and opportunities for AI to
              improve democracy. This map is intended for researchers, policymakers, private organisations, civil
              society and anyone interested in an overview of which areas of democracy are affected by AI related
              threats, as well as the mechanisms and activities involved in enabling harm and benefit to democracy.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#333", margin: 0 }}>
              Our team reviewed a diverse set of literature and selected ten leading frameworks mapping AI threats.
              This initial selection reflects different disciplinary lenses, levels of abstraction and democratic
              contexts.
            </p>
          </div>
        </div>

        <p
          className="p4d-underline-hover"
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 15.5,
            color: BRAND.ink,
            margin: "0 0 16px",
          }}
        >
          Explore findings from our initial literature analysis
        </p>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{ maxWidth: 860, flex: "1 1 auto", minWidth: 0 }}>
            <MapCarousel panels={panels} />
          </div>
          <QuestionBox />
        </div>

        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#333", margin: "28px 0 32px" }}>
          Each entry collected from the literature is mapped onto three things: the aspects of democracy it affects,
          which uses a slightly modified version of an International IDEA framework of democracy; the mechanism that
          enables the harm to democracy; the activity that brings the benefit to democracy. The last two set of
          codes, harm mechanisms and pro-democracy activity type were coded based on a categorisation by Power for
          Democracies.
        </p>

        <EntriesTable harmLookup={harmLookup} benefitLookup={benefitLookup} />
      </div>
    </div>
  );
}
