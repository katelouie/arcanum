VAR sarah_sessions_completed = 0
VAR sarah_total_sessions = 3
VAR sarah_client_notes = ""
VAR sarah_last_reading_date = ""
VAR sarah_confidence = 0
VAR reading_style = ""
VAR cards_drawn = ""

=== load_sarah ===
~ current_client = "sarah"
~ is_dashboard = false

{sarah_sessions_completed == 0: -> sarah_session_1}
{sarah_sessions_completed == 1: -> sarah_session_2}
{sarah_sessions_completed == 2: -> sarah_session_3}
{sarah_sessions_completed >= 3: -> sarah_complete_summary}

=== sarah_session_1 ===
Sarah shifts nervously in the chair across from you, clutching her coffee cup like a lifeline.
The late afternoon sun streams through your reading room window.

"Thanks for seeing me," she says, voice slightly shaky. "I graduated from my master's program three months ago, and I just... everything feels so uncertain right now. My boyfriend keeps asking when I'm going to 'figure things out,' my parents want to know my five-year plan, and I can barely decide what to have for breakfast."

She laughs, but there's anxiety behind it.

"I've never done this before - the tarot thing - but my friend Maya swears by it. I just need some clarity, you know?"

* [Reassure her that uncertainty after big transitions is normal] -> reassurance
* [Focus on what specific area needs clarity] -> focus_area
* [Suggest starting with cards to see what emerges] -> straight_to_cards

= reassurance
"That feeling of being adrift after graduation is incredibly common," you say gently. "You've just completed a major chapter of your life. Of course things feel uncertain."

Sarah's shoulders relax slightly.

~ sarah_confidence += 1

"The pressure from others doesn't help either. But this is your life, your timeline."

-> suggest_reading

= focus_area
"When you think about all these uncertainties, what feels most urgent right now?" you ask. # tooltip:Open questions help clients identify priorities

Sarah considers for a moment. "I think... it's about direction. Like, I have this degree in environmental policy, but I don't know if I want to work for the government, or a nonprofit, or go back to school, or completely change paths. And then there's Jake - my boyfriend - who's ready to move in together, but I don't even know where I want to live."

She takes a shaky breath.

"Everything's connected, but I can't see the bigger picture."

-> suggest_reading

= suggest_reading
"Would you like to do a three-card spread? Past, present, future - to help you see the bigger pattern of this transition?"

Sarah nods eagerly. "Yes, that sounds perfect."

-> draw_cards

= straight_to_cards
"Sometimes the cards can show us patterns we can't see ourselves," you say, reaching for your deck. "Let's see what wants to emerge."

~ shuffleDeck()

-> draw_cards

= draw_cards
You shuffle the deck slowly, letting Sarah watch the cards dance between your hands. The familiar rhythm is soothing.

"Take a deep breath and think about your question as I shuffle."

"For this reading, I'd like to do a three-card spread to explore your life transition," you explain as you continue shuffling.

~ drawCards("past-present-future", 3, "Sarah's Life Transition Reading")

Sarah leans forward, studying the cards intently.

"What do they mean?"

* [Interpret them as a journey of growth and self-discovery] -> growth_reading
* [Focus on practical steps and decision-making] -> practical_reading
* [Emphasize trusting her intuition over others' expectations] -> intuition_reading

= growth_reading

~ reading_style = "growth"

"I see a beautiful story of transformation here," you begin, tracing your finger across the cards from left to right.

"This isn't about having all the answers right now - it's about honoring where you've been, accepting where you are, and trusting the process of becoming."

You point to each card in turn, weaving their meanings into Sarah's specific situation - her academic journey, her current crossroads, and the potential that lies ahead when she stops trying to force certainty and starts following her genuine interests.

"Let me share something specific about what I'm seeing in your present situation card..." you say, focusing on the middle card.

The Hermit appears in the present position. # card:The Hermit

~ getCardInterpretation("The Hermit", "Present")

"The Hermit suggests this is a time for inner reflection and trusting your own wisdom," you continue. # emphasis

~ sarah_confidence += 2

Sarah listens intently, occasionally nodding. As you speak, you notice her posture straightening, her grip on the coffee cup loosening.

-> reading_conclusion

= practical_reading

~ reading_style = "practical"

"These cards are showing you that you're more ready than you think," you say, pointing to the spread. "You have tools, skills, and experience. Now it's about taking concrete steps."

You help her see how her environmental policy background gives her multiple pathways, how her relationship decision and career decision don't have to be made simultaneously, and how she can create some structure for herself while still leaving room for exploration.

~ sarah_confidence += 1

"What if you gave yourself permission to try one path for six months? Not forever - just as an experiment?"

Sarah's eyes light up. "That... actually feels manageable."

-> reading_conclusion

= intuition_reading

~ reading_style = "intuition"

"What strikes me about these cards is how they're asking you to tune out all those external voices," you say softly. "Your parents' timeline, Jake's expectations, society's pressure to have it all figured out."

You guide her to see how the cards reflect her own inner wisdom - the part of her that knows what environments energize her, what kind of impact she wants to make, what feels authentic versus what feels like she "should" want.

~ sarah_confidence += 2

"When you imagine yourself five years from now, living a life that feels completely right - what's the first image that comes to mind?"

Sarah closes her eyes briefly, then smiles - the first genuine smile of the session.

-> reading_conclusion

= reading_conclusion

{reading_style == "growth":
  Sarah sits back in her chair, looking thoughtful but more centered. "I keep thinking I need to have everything mapped out, but maybe that's not how life actually works."

  She gathers her things slowly. "I think I'm going to stop setting arbitrary deadlines for myself. Thank you - this really helped me see things differently."

  As she leaves, you notice she's walking taller, more purposefully.
}

{reading_style == "practical":
  "Six months of trying something feels so much less scary than 'choosing my career,'" Sarah laughs. "I think I'm going to apply for that research position at the environmental justice nonprofit. Worst case, I learn what I don't want."

  She stands to leave, energy noticeably lighter. "And I'm going to tell Jake I need a little more time before making big relationship decisions. I need to figure out who I am in this new chapter first."

  You watch her go, confident she has concrete next steps that feel manageable.
}

{reading_style == "intuition":
  Sarah is quiet for a long moment, then: "I keep seeing myself working directly with communities affected by environmental issues. Not writing policy from an office, but actually being there, listening to people."

  She looks surprised by her own words. "I didn't know I knew that."

  As she gathers her things, she seems less frantic, more grounded. "I think I need to trust myself more. Thank you for helping me remember I actually do have instincts about this stuff."
}

You make a note in Sarah's file: Session 1 complete. She seems more {sarah_confidence >= 2: confident and self-aware | calm} than when she arrived.

{sarah_confidence >= 2: You suspect she'll be back - not because she's lost, but because she's found something worth exploring further. | She'll likely benefit from another session once she's had time to process this one.}

~ sarah_client_notes = "March 15: Recent grad, environmental policy. Anxious about direction. Relationship with Jake uncertain."
~ sarah_sessions_completed = 1
~ sarah_last_reading_date = "March 15th"

* [Complete Session 1] -> session_1_end

= session_1_end
Session 1 is now complete. Thank you for guiding Sarah through her first reading.

-> reading_table

=== sarah_session_2 ===

Three weeks have passed since Sarah's first reading. She sits across from you again, but this time there's a different energy - less frantic, more purposeful, though you can sense some new tension beneath the surface.

"I took your advice," she begins, settling into the chair. "I applied for that research position at the environmental justice nonprofit. I got it."

She smiles, but it doesn't quite reach her eyes.

"I should be excited, right? It's exactly what I said I wanted. But now that I have it, I'm... I don't know. Scared? Second-guessing everything again?"

She fidgets with her sleeve. "And Jake and I had a big fight. When I told him I needed more time before moving in together, he said I was 'overthinking everything' and 'afraid of commitment.' Maybe he's right?"

* [Acknowledge that new opportunities can bring unexpected fears] -> fear_of_success
* [Explore what specifically feels scary about the job] -> job_concerns
* [Focus on the relationship dynamics with Jake] -> relationship_focus

= fear_of_success

"Sometimes getting what we ask for can feel more overwhelming than not having it," you say gently. "It's like the difference between dreaming about a door and actually having to walk through it."

Sarah nods vigorously. "Yes! Exactly. When it was theoretical, I felt so confident. Now it's real and I'm like... what if I mess this up? What if I'm not as passionate about this work as I thought?"

~ sarah_confidence -= 1

"And with Jake, what if he's right? What if I am just scared of committing to anything?"

-> draw_clarity_cards

= job_concerns

"Tell me more about what feels scary about starting this position," you encourage.

Sarah takes a deep breath. "I think... I'm worried I won't be good enough. This is real communities, real environmental damage, real people whose lives are affected. What if my academic knowledge isn't enough? What if I can't actually help?"

She pauses, looking vulnerable. "And there's this voice in my head that sounds like my dad, saying 'See? You should have just taken that government job with better benefits.'"

~ sarah_confidence += 1

"But then another part of me is really excited. Like, genuinely excited for the first time in months."

-> draw_clarity_cards

= relationship_focus

"What did it feel like when Jake said you were overthinking and afraid of commitment?" you ask.

Sarah's jaw tightens slightly. "Frustrating. Because maybe I am overthinking, but... I feel like he wants me to make decisions based on his timeline, not mine. When I got the job offer, his first question wasn't 'How do you feel about it?' It was 'Does this mean you'll know where you want to live now?'"

She looks thoughtful. "I love him, but I'm starting to wonder if we want the same things, or if he just wants me to want what he wants."

~ sarah_confidence += 2

-> draw_clarity_cards

= draw_clarity_cards

"It sounds like you're standing at another crossroads," you observe. "Would you like to pull some cards to help you see more clearly?"

Sarah nods. "Yes. I feel like I'm in my head about everything again."

You reach for your deck. "Let's do a different spread this time. How about a five-card spread focusing on your current challenges and hidden strengths?"

~ drawCards("five-card-cross", 5, "Sarah's Clarity and Strength Reading")

As you lay out the cards in a cross pattern, Sarah studies them intently.

"These feel different than last time," she murmurs.

* [Interpret the cards as showing her growth and readiness] -> growth_interpretation
* [Focus on the cards revealing her authentic self vs. others' expectations] -> authenticity_interpretation
* [Use the cards to explore practical next steps] -> action_interpretation

= growth_interpretation

~ reading_style = "growth_session2"

"What I see here is remarkable," you begin, pointing to the center card. "Look at how much you've grown in just three weeks. You asked for clarity, you got an opportunity, and yes, it's bringing up fears - but that's because you're actually moving forward."

You trace the pattern of the cards. "The fear you're feeling? It's not about being inadequate. It's the healthy nervousness of someone who cares deeply about doing meaningful work."

~ getCardInterpretation("Eight of Wands", "Present Challenge")

"And regarding Jake..." you continue, "these cards suggest that your need for more time isn't about being afraid of commitment. It's about being committed to your own growth first."

~ sarah_confidence += 2

Sarah's posture straightens. "So I'm not being flaky or indecisive?"

"You're being intentional. There's a big difference."

-> session_2_conclusion

= authenticity_interpretation

~ reading_style = "authenticity_session2"

"These cards are highlighting something important," you say, spreading your hand over the layout. "There's a tension here between who you authentically are and who others expect you to be."

You point to specific cards as you speak. "Your excitement about this job - that's your authentic self speaking. The doubts about whether you're 'good enough' - that sounds like internalized voices from others."

~ getCardInterpretation("The Star", "Hidden Strength")

"And in your relationship, these cards suggest that honoring your own timeline isn't selfish - it's necessary for any partnership to work long-term."

~ sarah_confidence += 3

Sarah leans forward. "I keep feeling like I should apologize for not knowing exactly what I want when I want it."

"What if instead of apologizing for your process, you honored it?"

-> session_2_conclusion

= action_interpretation

~ reading_style = "action_session2"

"These cards are very practical," you observe. "They're showing you that you don't have to figure everything out before you start. You can take action and adjust as you learn."

You point to each card in turn. "Start the job. See how it feels in your body. Trust your responses. You'll know within a few weeks whether this is right."

~ sarah_confidence += 1

"And with Jake - what if you gave yourself a specific timeline? Not for his sake, but for yours. 'I'll know more about what I want in this relationship after I've been in this job for two months.'"

~ getCardInterpretation("Three of Pentacles", "Near Future")

Sarah nods slowly. "That feels manageable. Like I'm not avoiding the conversation, just... timing it better."

-> session_2_conclusion

= session_2_conclusion

{reading_style == "growth_session2":
  Sarah gathers her things with a sense of renewed confidence. "I think I was treating every decision like it was permanent and irreversible. But jobs and relationships can evolve, right?"

  She pauses at the door. "I'm going to start this position and really pay attention to how it feels. Not what I think I should feel, but what I actually feel."
}

{reading_style == "authenticity_session2":
  "I think I need to have a different conversation with Jake," Sarah says thoughtfully. "Not about timelines, but about... whether he actually wants to know who I'm becoming, or if he just wants me to fit into his plan."

  She stands, looking more grounded. "And I'm going to trust that being excited about this work means something important."
}

{reading_style == "action_session2":
  Sarah laughs, and this time it's genuinely light. "Two months. I can do anything for two months, right? And then I'll reassess."

  She gathers her purse. "I'm going to treat this like an experiment instead of a life sentence. That feels so much more doable."
}

You update Sarah's notes: Shows more self-awareness and confidence than first session. Beginning to trust her own instincts over external pressure. {sarah_confidence >= 5: Ready for deeper work. | Still building confidence but making progress.}

~ sarah_client_notes += "\n\nApril 8: Started environmental justice job. Growing confidence but still navigating pressure from boyfriend Jake. Learning to trust her own timeline."
~ sarah_sessions_completed = 2
~ sarah_last_reading_date = "April 8th"

* [Complete Session 2] -> session_2_end

= session_2_end
Session 2 is now complete. Sarah is making good progress in trusting her own instincts.

-> reading_table

=== sarah_session_3 ===

Sarah arrives for her third session with a completely different energy. She's wearing work clothes - practical boots, a canvas jacket - and there's a vitality about her that wasn't there before. But you also notice she looks tired.

"So," she says, settling into the chair with a slight smile, "I've been at the job for six weeks now."

She pauses, seeming to gather her thoughts. "It's... intense. Good intense, mostly. I'm working with communities who've been fighting environmental racism for decades, and I'm learning so much. But also..."

She runs her hands through her hair. "I broke up with Jake."

The words hang in the air for a moment.

"He kept pushing about moving in together, and finally I realized - I wasn't hesitating because I wasn't ready. I was hesitating because something felt wrong. We want completely different things."

* [Ask how she's feeling about the breakup] -> breakup_feelings
* [Focus on what she's discovered about herself through work] -> work_discoveries
* [Explore what "different things" means to her now] -> values_clarification

= breakup_feelings

"How are you processing the end of that relationship?" you ask gently.

Sarah considers this carefully. "Honestly? Relief, mostly. Which maybe says everything I need to know. I thought I'd be devastated, but instead I feel... lighter?"

She shifts in her chair. "I think I was so focused on trying to make it work that I forgot to notice it wasn't working. Jake's a good person, but he wanted a girlfriend who had everything figured out so he could plan his life around that. I needed space to figure things out."

~ sarah_confidence += 2

"The hardest part is that my parents loved him. They keep asking if I'm sure I made the right choice."

-> work_reflection

= work_discoveries

"Tell me what you're learning about yourself through this work," you encourage.

Sarah's whole demeanor brightens. "I love the fieldwork. Like, love it in a way I didn't expect. Being in communities, listening to people's stories, helping them document environmental impacts - it feels so much more real than writing policy papers."

She leans forward, animated. "Last week I helped a grandmother in East Oakland show the air quality inspectors how the pollution spikes right after school lets out, when kids are walking home. We got the data they needed to challenge the permit renewal."

~ sarah_confidence += 3

"I come home exhausted but... fulfilled? Is that the right word? Like I'm using skills I didn't even know I had."

-> work_reflection

= values_clarification

"When you say you and Jake wanted different things, what does that mean to you now?"

Sarah is quiet for a moment, then: "He wanted security and predictability. A plan we could both follow. I thought I wanted that too, but actually... I think I want adventure. Growth. Work that matters even if it's harder."

She looks thoughtful. "He wanted to know where we'd be living in five years. I want to go where the work takes me. He wanted to settle down. I want to see what I'm capable of."

~ sarah_confidence += 2

"I don't think either way is wrong. We're just... incompatible."

-> work_reflection

= work_reflection

"It sounds like this work is teaching you something important about yourself," you observe.

"It is. But I'm also realizing how much I don't know. Some of the communities I'm working with have been fighting these battles for decades. I'm this privileged grad student showing up like I can help, and sometimes I wonder..."

She trails off, looking uncertain for the first time in the session.

"Whether you deserve to be there?" you prompt.

"Whether I'm actually helpful or just making myself feel better."

You reach for your cards. "Want to explore that question? Sometimes our deepest doubts and our greatest gifts are more connected than we think."

Sarah nods. "Yeah. I need perspective on this."

~ drawCards("celtic-cross", 10, "Sarah's Purpose and Calling Reading")

The ten cards spread across the table in the ancient Celtic Cross pattern. Sarah studies them with the focused attention of someone who's learned to trust the process.

* [Interpret the cards as revealing her unique gifts and purpose] -> purpose_reading
* [Focus on how to balance confidence with humility in service work] -> service_reading
* [Explore the deeper calling this work is awakening] -> calling_reading

= purpose_reading

~ reading_style = "purpose_session3"

"This is a powerful spread," you begin, your voice full of warmth. "Look at this central progression - it's showing me someone who's moving from uncertainty into their true purpose."

You point to the heart of the cross. "Your question about whether you deserve to be there, whether you're helpful - these cards suggest you're asking the right questions, but coming at them from the wrong angle."

~ getCardInterpretation("The Hermit", "Present Situation")

"The gift you bring isn't just your education. It's your willingness to listen, to question your own assumptions, to be uncomfortable. That's exactly what this work needs."

~ sarah_confidence += 3

Sarah studies the cards intently. "So the fact that I'm questioning myself is actually... good?"

"It's what keeps you humble and real. Communities can tell the difference between someone who thinks they have all the answers and someone who's genuinely there to learn and serve."

-> session_3_conclusion

= service_reading

~ reading_style = "service_session3"

"These cards are addressing your question head-on," you say, gesturing across the spread. "How do you serve effectively without taking up space that isn't yours?"

You trace the pattern from the foundation cards to the outcome. "The answer isn't to diminish yourself or your contributions. It's to stay connected to why you're really doing this work."

~ getCardInterpretation("Six of Pentacles", "Advice")

"When you help that grandmother document air quality data, you're not saving her - you're amplifying work she was already doing. You're bringing tools and connections she might not have had access to otherwise."

~ sarah_confidence += 2

Sarah nods slowly. "So it's about... partnership? Not rescue?"

"Exactly. And these cards suggest you understand that distinction better than you think you do."

-> session_3_conclusion

= calling_reading

~ reading_style = "calling_session3"

"What I see in these cards is someone who's found her calling," you say, your voice carrying a note of excitement. "And it's bigger than just this job."

You point to the outcome cards. "This work is awakening something in you - a sense of purpose that goes beyond career or relationship status or what others expect."

~ getCardInterpretation("The World", "Final Outcome")

"The questions you're asking yourself about worthiness and impact - those aren't signs of doubt. They're signs of someone who takes this work seriously enough to keep growing into it."

~ sarah_confidence += 4

Sarah sits back, looking almost surprised. "I do feel called to this. Like, really called. Even when it's hard, especially when it's hard."

"Trust that feeling. And trust your commitment to doing it with integrity."

-> session_3_conclusion

= session_3_conclusion

{reading_style == "purpose_session3":
  Sarah gathers the cards slowly, as if she doesn't want to break the spell. "I think I've been waiting for someone to give me permission to feel good about this work. But maybe that's not how it works."

  She stands, shouldering her canvas bag. "Maybe I just have to keep showing up and let the work teach me what I need to know."

  You watch her walk to the door with the measured pace of someone who knows where she's going, even if she doesn't know every step of the path.
}

{reading_style == "service_session3":
  "Partnership, not rescue," Sarah repeats, as if testing how the words feel in her mouth. "I like that. I think that's what felt different about this work - I'm not above it, I'm part of it."

  She pauses at the door. "And maybe that's true for my life too. I don't have to have all the answers. I just have to be willing to be part of something bigger than myself."
}

{reading_style == "calling_session3":
  Sarah is quiet for a long moment after you finish speaking. Then: "I've never felt called to anything before. I mean, I've been interested in things, passionate about issues, but this feels different."

  She gathers her things slowly. "It feels like... like this is what I was supposed to be doing all along. Even the hard parts, especially the hard parts."

  As she reaches the door, she turns back. "Thank you. For helping me trust something I was afraid to believe about myself."
}

You make your final notes: Remarkable transformation over three sessions. Found her calling in environmental justice work. Ended relationship that wasn't serving her growth. {sarah_confidence >= 8: Confident and purposeful. | Growing into herself with courage.} Ready to trust her own path.

~ sarah_client_notes += "\nMay 2nd: Thriving in environmental justice work. Ended relationship with Jake to follow her authentic path. Strong sense of purpose and calling. Confident in her ability to contribute meaningfully."
~ sarah_sessions_completed = 3
~ sarah_last_reading_date = "May 2nd"

* [Complete Session 3] -> session_3_end

= session_3_end
Session 3 is now complete. Sarah has found her calling and is ready to trust her own path.

-> reading_table

=== sarah_complete_summary ===
You review Sarah Chen's file - three powerful sessions that transformed an anxious recent graduate into a confident young woman following her calling in environmental justice work.

Her journey from uncertainty to purpose has been remarkable to witness. The cards guided her well, but more importantly, she learned to trust her own inner wisdom.

+ [Return to your reading table] -> reading_table
