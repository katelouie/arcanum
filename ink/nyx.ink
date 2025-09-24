// Cyberpunk Client

VAR nyx_sessions_completed = 0
VAR nyx_total_sessions = 5

=== load_nyx ===

~ current_client = "nyx"
~ is_dashboard = false

{nyx_sessions_completed:
    - 0: -> nyx_session_one
    - 1: -> nyx_session_two
    - 2: -> nyx_session_three
    - 3: -> nyx_session_four
    - 4: -> nyx_session_five
    - 5: -> nyx_complete_summary
}

=== nyx_session_one ===

Session 1: "System Diagnostics" # emphasis

-> reading_table

=== nyx_session_two ===

-> reading_table

=== nyx_session_three ===

-> reading_table

=== nyx_session_four ===

-> reading_table

=== nyx_session_five ===

-> reading_table

=== nyx_complete_summary ===

-> reading_table