from arcanum.reading import ReadingService
from arcanum.spreads import (
    SpreadLayout,
    SingleCardSpread,
    ThreeCardSpread,
    CelticCrossSpread,
)
from typing import Type


class TarotCLI:
    def __init__(self) -> None:
        self.reader = ReadingService()
        self.spreads: dict[str, Type[SpreadLayout]] = {
            "1": SingleCardSpread,
            "3": ThreeCardSpread,
            "celtic": CelticCrossSpread,
        }

    def run(self) -> None:
        """Main CLI loop."""
        print("Welcome to Arcanum - Your Digital Tarot Reader\n")

        while True:
            try:
                # Get the question
                question = self._get_question()
                if question.lower() in ["quit", "exit", "q"]:
                    print("Thank you for using Arcanum.")
                    break

                # Choose spread
                spread = self._choose_spread()

                # Get shuffle count
                shuffle_count = self._get_shuffle_count()

                # Ask about daily variation
                include_date = self._ask_daily_reading()

                # Perform reading
                print("\n🃏 Shuffling the cards...")
                reading = self.reader.perform_reading(
                    question=question,
                    spread=spread,
                    shuffle_count=shuffle_count,
                    include_date=include_date,
                )

                # Display results
                self._display_reading(reading)

                # Ask if they want another reading
                if not self._ask_continue():
                    print("Thank you for using Arcanum.")
                    break

            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            except Exception as e:
                print(f"An error occurred: {e}")
                print("Please try again.\n")

    def _get_question(self) -> str:
        """Get question from user."""
        print("What question would you like to ask the cards?")
        print("(or type 'quit' to exit)")
        question = input("Question: ").strip()

        if not question:
            print("Please enter a question.\n")
            return self._get_question()

        return question

    def _choose_spread(self) -> SpreadLayout:
        """Let user choose spread type."""
        print("\nChoose your spread:")
        for key, spread_class in self.spreads.items():
            spread_instance = spread_class()
            print(f"{key} - {str(spread_instance.name)}")

        choice = input("Choice: ").strip().lower()

        if choice in self.spreads:
            return self.spreads[choice]()
        else:
            print("Invalid choice. Please try again.\n")
            return self._choose_spread()

    def _get_shuffle_count(self) -> int:
        """Get number of shuffles from user"""
        print("\nHow many times would you like to shuffle? (1-21)")

        try:
            count = int(input("Shuffles: ").strip())
            if 1 <= count <= 21:
                return count
            else:
                print("Please enter a number between 1 and 21.\n")
                return self._get_shuffle_count()
        except ValueError:
            print("Please enter a valid number.\n")
            return self._get_shuffle_count()

    def _ask_daily_reading(self) -> bool:
        """Ask if this is a daily reading"""
        print("\nIs this a daily reading? (changes each day)")
        choice = input("Daily reading? (y/n): ").strip().lower()
        return choice in ["y", "yes"]

    def _display_reading(self, reading):
        """Display the reading results"""
        print("\n" + "=" * 50)
        print("YOUR READING")
        print("=" * 50)
        print(reading)
        print("=" * 50)

    def _ask_continue(self) -> bool:
        """Ask if user wants another reading"""
        print("\nWould you like another reading?")
        choice = input("Continue? (y/n): ").strip().lower()
        return choice in ["y", "yes"]


def main():
    """Entry point for the CLI"""
    cli = TarotCLI()
    cli.run()


if __name__ == "__main__":
    main()
