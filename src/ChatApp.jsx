import React, { useState, useRef, useEffect } from 'react';
import {Send} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAi = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const model = genAi.getGenerativeModel({model: "gemini-2.0-flash"});

function ChatApp() {
    const [messages, setMessages] = useState([
        {sender: "ai", text:"Hello, how can I help you today?"},
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messageEndRef = useRef(null);
    const chatSessionRef = useRef(null);
    
    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
        if(!chatSessionRef.current){
            chatSessionRef.current = model.startChat({
                generationConfig: {
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
                history: [],
            });
        }

    }, [messages]);

    const handleSubmit = async(e) => {
        e.preventDefault();
        if(!input.trim()) return;

        setMessages((prev) => [...prev, {sender: "user", text: input }]);
        setInput("");
        setIsTyping(true);

        try{
            let fullResponse = ""
            const result = await chatSessionRef.current.sendMessageStream(input);

            setMessages((prev) => [
                ...prev, 
                {sender: "ai", text: "", isGenerating: true},
            ])

            for await (const chunk of result.stream){
                const chunkText = chunk.text();
                fullResponse += chunkText;

                setMessages((prev) => [
                    ...prev.slice(0, -1), 
                    // eslint-disable-next-line
                    {sender: "ai", text: fullResponse, isGenerating: true},
                ]);

            }

        setMessages((prev) => [
            ...prev.slice(0, -1), 
            {sender: "ai", text: fullResponse, isGenerating: false},
        ]);
        setIsTyping(false)
        

        }catch(error){
            console.log(error);
            setIsTyping(false);
            setMessages((prev) => [...prev, {
                sender: "ai", 
                ext: "Sorry, there was an error", 
                isGenerating: false,
             },
            ]);
        }
    };

    const MarkdownComponent = {
        code({node, inline, className, children, ...props}){
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
                <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
                >
                        {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            )
        }
    }
    
  return(
    //fade in and out animation while loading
    <div className='flex flex-col h-screen bg-gray-100'>
        <style jsx global> 
        {`
            @keyframes typing {
                0% {
                    opacity: 0.3;
                }

                50% {
                    opacity: 1;
                }

                100% {
                    opacity: 0.3;
                }
            }

        .typing-animation{
            animation: typing 1.5s infinite; 
        }
        
    `}


        </style>
        <header className="bg-black p-5 text-white flex justify-center">
            <h1 className='text-3xl font-bold font-sf-pro'>ChatBot</h1>
        </header>

        <div className='flex-1 overflow-y-auto p-4 bg-black '>
            {messages.map((message, index) => (
                <div
                key={index} 
                
                className={`mb-4 
                ${message.sender === 'user' 
                ? 'text-right' 
                : 'text-left'}`}
                >

                    <div 
                    className={`inline-block p-2 rounded-lg ${
                    message.sender === "user" 
                    ? "bg-blue-500 text-white font-sf-pro text-lg ml-24" 
                    : "bg-zinc-800 text-white font-sf-pro text-lg p-4 mr-24"
                    }`}
                    >
                        {message.sender === "user" 
                        ? (message.text) 
                        : (<ReactMarkdown
                            className={`prose max-w-none 
                            ${message.isGenerating 
                            ? "typing-animation" : ""
                            }`}
                            components={MarkdownComponent}
                        >
                            {message.text || "Thinking..."}
                        </ReactMarkdown>
                        )}
                    </div>
                </div>
            ))}

            {isTyping && (
              <div class="text-left">
                <div class="inline-block p-2 rounded-lg bg-zinc-800 font-sf-pro text-lg text-white">
                    ...
                </div>
              </div>  
            )}

            <div ref={messageEndRef}/>
        </div>

        <form onSubmit={handleSubmit} class="p-4 bg-black text-white">
            <div class="flex items-center">
                <input 
                type="text" 
                className="flex-1 p-2 border rounded-2xl focus:outline-none bg-black text-white font-sf-pro text-lg"
                value={ input }
                placeholder='Type a message'
                onChange={(e) => setInput(e.target.value)}

                />
                <button class="ml-2 p-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 focus:outline-none">
                    <Send size={24}/>
                </button>
            </div>
        </form>
    </div>
  ); 
}

export default ChatApp
