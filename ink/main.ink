INCLUDE sarah.ink
INCLUDE nyx.ink
INCLUDE test_client.ink

VAR current_client = ""
VAR is_dashboard = true
VAR global_reader_reputation = 0

// Old External functions for tarot functionality
EXTERNAL drawCards(spread, count, title)
EXTERNAL shuffleDeck()
// Current functions
EXTERNAL getCardInterpretation(cardName, position)
EXTERNAL displayReading(cardList, spreadType, title)
EXTERNAL GetCard(constraint)

-> reading_table

=== reading_table ===
~ is_dashboard = true
~ current_client = ""

The soft glow of candles illuminates your reading table. Your appointment book lies open, the familiar weight of the tarot deck resting beside it. Another day of guiding souls through uncertainty begins.

+ [Continue with Sarah Chen (Session {sarah_sessions_completed}/{sarah_total_sessions})] -> load_sarah
+ [Continue with Jane Doe (Development Testing)] -> load_jane
+ [Continue with Nyx (Session {nyx_sessions_completed}/{nyx_total_sessions})] -> load_nyx
+ [Review your practice notes] -> review_notes
* [Close the reading room for today] -> day_complete

=== review_notes ===
You open your practice journal, reviewing the clients you've guided recently.


{sarah_sessions_completed > 0: Sarah Chen:}
{sarah_sessions_completed > 0: {sarah_client_notes}}


Each reading teaches you something new about the delicate art of guidance - how to hold space for uncertainty while helping others find their own truth.

+ [Return to your reading table] -> reading_table

=== day_complete ===
You extinguish the candles one by one, their smoke curling upward like released prayers. Another day of service complete.

The cards rest quietly in their velvet cloth, holding the stories of all who sought guidance today. Tomorrow will bring new souls, new questions, new opportunities to serve.

-> END