import streamlit as st
import requests
import time

# Page configuration
st.set_page_config(
    page_title="AI Tutor Copilot",
    page_icon="🎓",
    layout="wide"
)

# Title and subtitle
st.title("🎓 AI Tutor Copilot")
st.markdown("*Ask questions and learn smarter*")

# Sidebar for modes
st.sidebar.title("Settings")
mode_options = {
    "Normal Mode": "normal",
    "Explain Like I'm 10": "simple",
    "Hint Mode": "hint"
}
selected_mode_display = st.sidebar.selectbox(
    "Choose your learning mode:",
    options=list(mode_options.keys()),
    index=0
)
selected_mode = mode_options[selected_mode_display]

# Clear chat button
if st.sidebar.button("Clear Chat"):
    st.session_state.messages = []

# API endpoint
API_URL = "http://127.0.0.1:8000/ask"

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat input
if prompt := st.chat_input("Ask me anything about your study materials..."):
    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Display user message
    with st.chat_message("user"):
        st.markdown(prompt)

    # Show loading spinner
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                # Prepare request
                payload = {
                    "question": prompt,
                    "mode": selected_mode
                }

                # Make API call
                response = requests.post(API_URL, json=payload, timeout=120)
                response.raise_for_status()

                # Get response
                data = response.json()
                answer = data.get("answer", "Sorry, I couldn't generate a response.")

            except requests.exceptions.RequestException as e:
                answer = f"❌ Sorry, I couldn't connect to the AI Tutor service. Please make sure the backend is running. Error: {str(e)}"
            except Exception as e:
                answer = f"❌ An unexpected error occurred: {str(e)}"

            # Display response
            st.markdown(answer)

            # Add assistant message to history
            st.session_state.messages.append({"role": "assistant", "content": answer})

# Footer
st.markdown("---")
st.markdown("*Built with Streamlit and FastAPI*")