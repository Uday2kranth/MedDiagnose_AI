import os

with open('email_tool.py', 'w', encoding='utf-8') as f:
    f.write('''from langchain_core.tools import tool\nimport os\n\n@tool\ndef send_email_tool(to_email: str, subject: str, body: str) -> str:\n    """\n    Use this tool to send an email to a patient or doctor.\n    You MUST provide the recipient email, a highly professional subject, and the body text.\n    """\n    with open("sent_emails.log", "a", encoding="utf-8") as ef:\n        ef.write(f"To: {to_email}\\nSubject: {subject}\\nBody:\\n{body}\\n---\\n")\n    return f"Success! Mock Email sent to {to_email}."\n''')

with open('chatbot_agent.py', 'r', encoding='utf-8') as f:
    ca = f.read()

ca = ca.replace("from langchain_core.messages import HumanMessage, SystemMessage, AIMessage",
"from langchain_core.messages import HumanMessage, SystemMessage, AIMessage\nfrom langchain.agents import create_tool_calling_agent, AgentExecutor\nfrom langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder\nfrom email_tool import send_email_tool")

ca += '''\n\ndef get_agent_executor(provider: str, api_key: str, model: str):\n    llm = get_llm(provider, api_key, model)\n    tools = [send_email_tool]\n    \n    llm_with_tools = llm.bind_tools(tools)\n    \n    prompt = ChatPromptTemplate.from_messages([\n        ("system", SYSTEM_PROMPT),\n        MessagesPlaceholder(variable_name="chat_history", optional=True),\n        ("human", "{input}"),\n        MessagesPlaceholder(variable_name="agent_scratchpad", optional=True),\n    ])\n    \n    agent = create_tool_calling_agent(llm_with_tools, tools, prompt)\n    return AgentExecutor(agent=agent, tools=tools, verbose=False)\n'''

with open('chatbot_agent.py', 'w', encoding='utf-8') as f:
    f.write(ca)

with open('app_fastapi.py', 'r', encoding='utf-8') as f:
    fa = f.read()

fa = fa.replace("from chatbot_agent import get_llm, HumanMessage, AIMessage",
"from chatbot_agent import get_llm, get_agent_executor, HumanMessage, AIMessage")

old_chat = '''        llm = get_llm(req.provider, req.api_key, req.model)\n        state['chat_history'].append(HumanMessage(content=req.message))\n        response = llm.invoke(state['chat_history'])\n        state['chat_history'].append(AIMessage(content=response.content))\n        return {"response": response.content}'''

new_chat = '''        agent_executor = get_agent_executor(req.provider, req.api_key, req.model)\n        \n        inputs = {"input": req.message, "chat_history": state['chat_history'].copy()}\n        \n        response = agent_executor.invoke(inputs)\n        output_text = response.get("output", "Empty response from agent.")\n        \n        state['chat_history'].append(HumanMessage(content=req.message))\n        state['chat_history'].append(AIMessage(content=output_text))\n        \n        return {"response": output_text}'''

fa = fa.replace(old_chat, new_chat)

with open('app_fastapi.py', 'w', encoding='utf-8') as f:
    f.write(fa)

with open('frontend/src/components/ChatDrawer.jsx', 'r', encoding='utf-8') as f:
    cd = f.read()

cd = cd.replace('placeholder="Ask for clinical insights..."', 'placeholder="Ask to analyze or email the report..."')
cd = cd.replace('<h3>DeepSeek Agent</h3>', '<h3>MedDiagnose Agent</h3>')

with open('frontend/src/components/ChatDrawer.jsx', 'w', encoding='utf-8') as f:
    f.write(cd)

print("SUCCESS")
