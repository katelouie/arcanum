VAR sarah_confidence = 0
VAR reading_style = ""
VAR cards_drawn = ""

EXTERNAL drawCards(spread, count, title)
EXTERNAL shuffleDeck()
EXTERNAL getCardInterpretation(cardName, position)

-> sarah_first_session

=== sarah_first_session ===
Sarah shifts nervously in the chair across from you, clutching her coffee cup like a lifeline. The late afternoon sun streams through your reading room window.

"Thanks for seeing me," she says, voice slightly shaky. "I graduated from my master's program three months ago, and I just... everything feels so uncertain right now. My boyfriend keeps asking when I'm going to 'figure things out,' my parents want to know my five-year plan, and I can barely decide what to have for breakfast."

She laughs, but there's anxiety behind it.

"I've never done this before - the tarot thing - but my friend Maya swears by it. I just need some clarity, you know?"

* [Reassure her that uncertainty after big transitions is normal] -> reassurance
* [Focus on what specific area needs clarity] -> focus_area
* [Suggest starting with cards to see what emerges] -> straight_to_cards

=== reassurance ===
"That feeling of being adrift after graduation is incredibly common," you say gently. "You've just completed a major chapter of your life. Of course things feel uncertain."

Sarah's shoulders relax slightly.

~ sarah_confidence += 1

"The pressure from others doesn't help either. But this is your life, your timeline."

-> suggest_reading

=== focus_area ===
"When you think about all these uncertainties, what feels most urgent right now?" you ask.

Sarah considers for a moment. "I think... it's about direction. Like, I have this degree in environmental policy, but I don't know if I want to work for the government, or a nonprofit, or go back to school, or completely change paths. And then there's Jake - my boyfriend - who's ready to move in together, but I don't even know where I want to live."

She takes a shaky breath.

"Everything's connected, but I can't see the bigger picture."

-> suggest_reading

=== straight_to_cards ===
"Sometimes the cards can show us patterns we can't see ourselves," you say, reaching for your deck. "Let's see what wants to emerge."

~ shuffleDeck()

-> draw_cards

=== suggest_reading ===
"Would you like to do a three-card spread? Past, present, future - to help you see the bigger pattern of this transition?"

Sarah nods eagerly. "Yes, that sounds perfect."

-> draw_cards

=== draw_cards ===
You shuffle the deck slowly, letting Sarah watch the cards dance between your hands. The familiar rhythm is soothing.

"Take a deep breath and think about your question as I shuffle."

"For this reading, I'd like to do a three-card spread to explore your life transition," you explain as you continue shuffling.

~ drawCards("past-present-future", 3, "Sarah's Life Transition Reading")

Sarah leans forward, studying the cards intently.

"What do they mean?"

* [Interpret them as a journey of growth and self-discovery] -> growth_reading
* [Focus on practical steps and decision-making] -> practical_reading  
* [Emphasize trusting her intuition over others' expectations] -> intuition_reading

=== growth_reading ===

~ reading_style = "growth"

"I see a beautiful story of transformation here," you begin, tracing your finger across the cards from left to right.

"This isn't about having all the answers right now - it's about honoring where you've been, accepting where you are, and trusting the process of becoming."

You point to each card in turn, weaving their meanings into Sarah's specific situation - her academic journey, her current crossroads, and the potential that lies ahead when she stops trying to force certainty and starts following her genuine interests.

"Let me share something specific about what I'm seeing in your present situation card..." you say, focusing on the middle card.

~ getCardInterpretation("The Hermit", "Present")

"The Hermit suggests this is a time for inner reflection and trusting your own wisdom," you continue.

~ sarah_confidence += 2

Sarah listens intently, occasionally nodding. As you speak, you notice her posture straightening, her grip on the coffee cup loosening.

-> reading_conclusion

=== practical_reading ===

~ reading_style = "practical"

"These cards are showing you that you're more ready than you think," you say, pointing to the spread. "You have tools, skills, and experience. Now it's about taking concrete steps."

You help her see how her environmental policy background gives her multiple pathways, how her relationship decision and career decision don't have to be made simultaneously, and how she can create some structure for herself while still leaving room for exploration.

~ sarah_confidence += 1

"What if you gave yourself permission to try one path for six months? Not forever - just as an experiment?"

Sarah's eyes light up. "That... actually feels manageable."

-> reading_conclusion

=== intuition_reading ===

~ reading_style = "intuition"

"What strikes me about these cards is how they're asking you to tune out all those external voices," you say softly. "Your parents' timeline, Jake's expectations, society's pressure to have it all figured out."

You guide her to see how the cards reflect her own inner wisdom - the part of her that knows what environments energize her, what kind of impact she wants to make, what feels authentic versus what feels like she "should" want.

~ sarah_confidence += 2

"When you imagine yourself five years from now, living a life that feels completely right - what's the first image that comes to mind?"

Sarah closes her eyes briefly, then smiles - the first genuine smile of the session.

-> reading_conclusion

=== reading_conclusion ===

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

-> END
