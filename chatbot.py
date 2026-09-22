import re
from datetime import datetime


class KesavChatbot:
    def __init__(self):
        self.name = "Kesav Chatbot"

    def get_response(self, user_input):
        text = user_input.lower().strip()

        # Exit commands
        if re.search(r"\b(bye|exit|quit|goodbye)\b", text):
            return "Goodbye! It was nice talking to you. 👋"

        # Greetings
        if re.search(r"\b(hi|hello|hey|hii|helo)\b", text):
            return "Hello! 👋 I'm Kesav Chatbot. How can I help you?"

        # Name
        if "your name" in text or "who are you" in text:
            return (
                "My name is Kesav Chatbot. "
                "I'm a rule-based chatbot created using Python."
            )

        # How are you
        if re.search(r"\bhow are you\b", text):
            return "I'm doing great! Thanks for asking. 😊 How are you?"

        # User is fine
        if re.search(
            r"\b(i am good|i'm good|i am fine|i'm fine|doing good)\b",
            text
        ):
            return "That's great to hear! 😄"

        # Help
        if re.search(r"\b(help|commands|what can you do)\b", text):
            return (
                "I can respond to greetings, tell you about myself, "
                "give the current date and time, and answer basic questions "
                "about AI and programming."
            )

        # Date
        if re.search(r"\b(date|today)\b", text):
            current_date = datetime.now().strftime("%A, %d %B %Y")
            return f"Today's date is {current_date}."

        # Time
        if re.search(r"\b(time|clock)\b", text):
            current_time = datetime.now().strftime("%I:%M:%S %p")
            return f"The current time is {current_time}."

        # Python / Programming
        if re.search(r"\b(python|programming|coding|code)\b", text):
            return (
                "Python is a beginner-friendly programming language "
                "widely used in web development, automation, data science, "
                "and Artificial Intelligence."
            )

        # Artificial Intelligence
        if re.search(
            r"\b(ai|artificial intelligence|machine learning)\b",
            text
        ):
            return (
                "Artificial Intelligence enables computers to perform "
                "tasks that normally require human intelligence, such as "
                "understanding language, recognizing images, and making decisions."
            )

        # College / Student
        if re.search(r"\b(college|university|student)\b", text):
            return (
                "College is a great place to learn technical skills, "
                "build projects, participate in hackathons, and develop your career."
            )

        # Thanks
        if re.search(r"\b(thanks|thank you|thankyou)\b", text):
            return "You're welcome! 😊"

        # Positive response
        if re.search(r"\b(great|awesome|nice|cool)\b", text):
            return "Glad you think so! 😄"

        # Unknown input
        return (
            "I'm still learning! I don't have a predefined response "
            "for that. Try asking me about AI, Python, programming, "
            "the date, or the time."
        )


def main():
    chatbot = KesavChatbot()

    print("=" * 60)
    print("                    KESAV CHATBOT")
    print("             Rule-Based AI Chatbot")
    print("=" * 60)
    print("Type 'help' to see what I can do.")
    print("Type 'bye' to exit.")
    print()

    while True:
        user_input = input("You: ")

        if not user_input.strip():
            print("Kesav Chatbot: Please type something! 😊")
            continue

        response = chatbot.get_response(user_input)

        print(f"Kesav Chatbot: {response}")

        if re.search(
            r"\b(bye|exit|quit|goodbye)\b",
            user_input.lower()
        ):
            break


if __name__ == "__main__":
    main()