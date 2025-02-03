// DOM Elements
const chatbox = document.getElementById('chatbox');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const jobDescription = document.getElementById('job-description');

// Speech Recognition Variables
let recognition;
let isRecognizing = false;
let conversationHistory = [];

// Add a new variable to track if we want recognition active
let shouldBeListening = false;

// Add a flag to track if we've shown the listening message
let listeningMessageShown = false;

// Add role identification variables
const ROLE = {
    INTERVIEWER: 'interviewer',
    INTERVIEWEE: 'interviewee'
};

// Update the personal information with detailed resume data
const personalInfo = {
    name: "Vaibhav Kumawat",
    contact: {
        phone: "+91 7851981514",
        email: "vaibhavkumawat1003@gmail.com",
        linkedin: "linkedin.com/in/vaibhavk10",
        github: "github.com/vaibhavk10",
        portfolio: "vaibhavk10.github.io/PortFolio/"
    },
    education: {
        btech: {
            degree: "B.Tech in Electronics & Computer Engineering",
            institution: "Vellore Institute of Technology, Chennai",
            cgpa: "8.33",
            period: "2021 - Present"
        },
        class12: {
            school: "Matrix High School, Sikar",
            percentage: "96.80%",
            period: "2020 - 2021"
        },
        class10: {
            school: "Gurukul Academy, Jaipur",
            percentage: "88.67%",
            period: "2018 - 2019"
        }
    },
    projects: [
        {
            name: "Snack Delivery Application",
            description: "Developed a snack delivery app",
            technologies: ["Kotlin", "Android Studio"]
        },
        {
            name: "Food Express Website",
            description: "Responsive food delivery website featuring dynamic menu categories and seamless navigation",
            technologies: ["HTML", "CSS", "JavaScript"]
        },
        {
            name: "Blockchain Evidence Management System",
            description: "Blockchain-based system for securely adding, viewing, and deleting records using SHA-256 hashing",
            technologies: ["Flask", "HTML", "CSS"]
        },
        {
            name: "ChatMate AI",
            description: "AI-powered chatbot using Google's Gemini API with an intuitive interface for real-time communication",
            technologies: ["HTML", "CSS", "JavaScript"]
        },
        {
            name: "Flood Warning System",
            description: "IoT-based system for early flood detection using predictive analysis and sensor networks",
            technologies: ["Arduino", "ESP8266", "Python"]
        }
    ],
    skills: {
        programming: ["Java", "Python", "SQL"],
        webDev: ["HTML", "CSS", "JavaScript"],
        androidDev: ["Kotlin", "Android Studio"],
        tools: ["Git", "Firebase", "Heroku", "Kali Linux"]
    },
    certifications: ["Android Application Development"],
    interests: ["Cricket", "Music", "Gaming"],
    extraCurricular: ["Designer for TEDx Club, creating promotional visuals and branding, ensuring thematic consistency"]
};

// Check if Speech Recognition is supported
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecognizing = true;
        if (!listeningMessageShown) {
        addMessage('System', 'Listening...');
            listeningMessageShown = true;
        }
    };

    recognition.onresult = async (event) => {
        const lastResult = event.results[event.results.length - 1];
        
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.trim();
            
            if (lastResult[0].confidence > 0.5) {
                console.log('Processing speech input:', transcript);
                const role = determineRole(transcript);
                console.log(`Role determined: ${role}`);

        // Add to conversation history
        conversationHistory.push({
                    role: role,
                    content: transcript,
                    timestamp: new Date().toISOString()
        });

                if (role === ROLE.INTERVIEWER) {
                    addMessage('Interviewer', transcript);
        await getAIResponse(transcript);
                } else {
                    console.log('Stored interviewee response:', transcript);
                    // Optional: Add a subtle indicator that response was stored
                    addMessage('System', '✓ Response recorded', true);
                }
            } else {
                addMessage('System', 'Sorry, could you please repeat that?');
            }
        }
    };

    // Add a new error handler for no-speech
    recognition.onnomatch = () => {
        addMessage('System', 'Could not understand. Please try again.');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        addMessage('System', 'Error occurred during speech recognition.');
    };

    recognition.onend = () => {
        console.log('Recognition ended, shouldBeListening:', shouldBeListening);
        
        if (shouldBeListening) {
            try {
                setTimeout(() => {
                    recognition.start();
                    isRecognizing = true;
                    console.log('Restarted listening');
                }, 100);
            } catch (error) {
                console.error('Error restarting recognition:', error);
                shouldBeListening = false;
                startBtn.disabled = false;
                stopBtn.disabled = true;
                listeningMessageShown = false;
            }
        } else {
        isRecognizing = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
        addMessage('System', 'Stopped listening.');
            listeningMessageShown = false;
        }
    };
} else {
    addMessage('System', 'Speech Recognition is not supported in this browser.');
    startBtn.disabled = true;
}

// Start Listening
startBtn.addEventListener('click', () => {
    console.log('Start button clicked');
    shouldBeListening = true;
    try {
        recognition.start();
        isRecognizing = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } catch (error) {
        console.error('Error starting recognition:', error);
        shouldBeListening = false;
    }
});

// Stop Listening
stopBtn.addEventListener('click', () => {
    console.log('Stop button clicked');
    shouldBeListening = false;
    listeningMessageShown = false;
    try {
        recognition.stop();
        isRecognizing = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    } catch (error) {
        console.error('Error stopping recognition:', error);
    }
});

// Add function to parse job description
function parseJobDescription(text) {
    if (!text || text.trim() === '') return null;
    
    const description = text.trim();
    const parsedData = {
        companyName: extractCompanyName(description),
        requirements: extractKeyRequirements(description),
        technologies: extractTechnologies(description),
        roleType: extractRoleType(description)
    };

    // Log parsed data for debugging
    console.log('Parsed Job Description:', parsedData);
    return parsedData;
}

// Improve company name extraction
function extractCompanyName(text) {
    const patterns = [
        /(?:at|join|company:|employer:)\s+([A-Z][A-Za-z0-9\s&]+?)(?=\s*(?:is|are|\.|,|;|$))/i,
        /([A-Z][A-Za-z0-9\s&]+?)(?:\s+is hiring|\s+is looking)/i,
        /^([A-Z][A-Za-z0-9\s&]+?)(?:\s+|-)/i,  // Match company name at start
        /Company:\s*([A-Z][A-Za-z0-9\s&]+)/i    // Explicit company field
    ];
    
    for (let pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            console.log('Found company name:', match[1].trim());
            return match[1].trim();
        }
    }
    return 'Not specified';
}

// Improve requirements extraction
function extractKeyRequirements(text) {
    const requirements = [];
    
    // Look for requirements in different formats
    const patterns = [
        /requirements?:?(.*?)(?:\n\n|$)/is,
        /qualifications?:?(.*?)(?:\n\n|$)/is,
        /we are looking for:?(.*?)(?:\n\n|$)/is,
        /what you'll need:?(.*?)(?:\n\n|$)/is
    ];

    for (let pattern of patterns) {
        const reqSection = text.match(pattern);
        if (reqSection && reqSection[1]) {
            // Extract both bullet points and numbered lists
            const reqList = reqSection[1].match(/(?:[-•*]\s*|^\d+\.\s*)([^-•\n]+)/gm) || [];
            requirements.push(...reqList.map(req => req.trim()));
        }
    }
    
    console.log('Found requirements:', requirements);
    return requirements.length > 0 ? requirements : ['Not specified'];
}

// Improve technology extraction
function extractTechnologies(text) {
    const techKeywords = [
        'java', 'python', 'javascript', 'react', 'angular', 'vue', 'node.js',
        'android', 'kotlin', 'swift', 'ios', 'flutter', 'react native',
        'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
        'aws', 'azure', 'docker', 'kubernetes', 'git', 'jenkins',
        'spring', 'hibernate', 'express.js', 'django', 'flask'
    ];
    
    const foundTech = techKeywords.filter(tech => 
        text.toLowerCase().includes(tech.toLowerCase())
    );
    
    console.log('Found technologies:', foundTech);
    return foundTech.length > 0 ? foundTech : ['Not specified'];
}

// Improve role type extraction
function extractRoleType(text) {
    const rolePatterns = [
        /(?:position|role|job):\s*([^.;\n]+)/i,
        /hiring\s+(?:a|an)\s+([^.;\n]+)/i,
        /(?:for|as)\s+(?:a|an)\s+([^.;\n]+?(?:developer|engineer|designer|architect|analyst|manager))/i,
        /([^.;\n]+?(?:developer|engineer|designer|architect|analyst|manager))\s+(?:position|role|job)/i
    ];
    
    for (let pattern of rolePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            console.log('Found role:', match[1].trim());
            return match[1].trim();
        }
    }
    return 'Not specified';
}

// Add event listener for job description changes
jobDescription.addEventListener('input', () => {
    console.log('Job description updated:', jobDescription.value);
    const parsedJob = parseJobDescription(jobDescription.value);
    console.log('Parsed job data:', parsedJob);
});

// Update the role determination function with more robust patterns
function determineRole(text) {
    const normalizedText = text.trim().toLowerCase();
    
    // More comprehensive question patterns
    const questionPatterns = [
        /\?$/,  // Ends with question mark
        /^(?:what|why|how|when|where|who|which|can|could|would|will|should|do|does|did|is|are|was|were)\b/i,  // Question starters
        /^tell me\b|^explain\b|^describe\b|^elaborate\b|^share\b/i,  // Request phrases
        /\b(?:what|why|how|when|where|who) (?:is|are|was|were|do|does|did)\b/i,  // Mid-sentence questions
        /\bcan you\b|\bcould you\b|\bwould you\b/i  // Polite questions
    ];

    // Answer patterns that indicate it's likely a response
    const answerPatterns = [
        /^(?:yes|no|sure|okay|well|so|basically|actually|right)\b/i,  // Common answer starters
        /^(?:i have|i am|i was|i worked|i developed|i created|i used|i implemented)\b/i,  // First-person statements
        /^(?:my experience|my project|my role|my responsibility)\b/i,  // Experience statements
        /^(?:during my|while working|in my)\b/i,  // Context statements
        /^(?:the reason|the main|the key|the project)\b/i  // Explanation starters
    ];

    // Log for debugging
    console.log('Analyzing text:', normalizedText);

    // First check for explicit question patterns
    const isQuestion = questionPatterns.some(pattern => {
        const matches = pattern.test(normalizedText);
        if (matches) {
            console.log('Matched question pattern:', pattern);
        }
        return matches;
    });

    // Then check for explicit answer patterns
    const isAnswer = answerPatterns.some(pattern => {
        const matches = pattern.test(normalizedText);
        if (matches) {
            console.log('Matched answer pattern:', pattern);
        }
        return matches;
    });

    // Decision logic with logging
    if (isQuestion && !isAnswer) {
        console.log('Determined as: Interviewer (Question)');
        return ROLE.INTERVIEWER;
    } else if (isAnswer && !isQuestion) {
        console.log('Determined as: Interviewee (Answer)');
        return ROLE.INTERVIEWEE;
    } else {
        // If ambiguous, use length and structure as heuristics
        const isLongResponse = text.length > 50;
        const hasMultipleSentences = text.split(/[.!?]+/).length > 1;
        
        if (isLongResponse || hasMultipleSentences) {
            console.log('Determined as: Interviewee (based on length/structure)');
            return ROLE.INTERVIEWEE;
        } else {
            console.log('Determined as: Interviewer (default for short/ambiguous)');
            return ROLE.INTERVIEWER;
        }
    }
}

// Update the getAIResponse function
async function getAIResponse(userQuestion) {
    try {
        addMessage('System', 'Processing...');

        const jobContext = parseJobDescription(jobDescription.value);
        
        const prompt = `<|im_start|>system
You are an AI assistant helping in a technical interview. You are acting as ${personalInfo.name}, a B.Tech student. Answer questions professionally and concisely based on the following background:

Education:
- B.Tech in Electronics & Computer Engineering at VIT Chennai (CGPA: 8.33)
- 12th: 96.80% from Matrix High School
- 10th: 88.67% from Gurukul Academy

Skills:
- Programming: Java, Kotlin, Python, SQL
- Web Development: HTML, CSS, JavaScript
- Android Development: Android Studio, Payment Integration
- Tools: Git, Firebase, Heroku, Figma

Projects:
1. Snack Delivery App (Kotlin, Android)
2. Food Express Website (HTML, CSS, JS)
3. Blockchain Evidence System (Flask)
4. ChatMate AI (JavaScript)
5. Flood Warning System (IoT)

${jobContext ? `Company Context:
- Company: ${jobContext.companyName}
- Role: ${jobContext.roleType}
- Requirements: ${jobContext.requirements.join(', ')}` : ''}
<|im_end|>
<|im_start|>user
${userQuestion}
<|im_end|>
<|im_start|>assistant`;

        const response = await fetch(
            "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
            {
            headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.HUGGINGFACE_API_KEY}`
            },
                method: "POST",
            body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 500,
                        temperature: 0.7,
                        top_p: 0.95,
                        return_full_text: false
                    }
                })
            }
        );

        const result = await response.json();
        
        if (Array.isArray(result) && result[0]?.generated_text) {
            const aiResponse = result[0].generated_text
                .replace(/<\|im_start\|>assistant/, '')
                .replace(/<\|im_end\|>/, '')
                .trim();
                
            addMessage('AI Assistant', aiResponse);
            
            conversationHistory.push({
                role: "assistant",
                content: aiResponse,
                timestamp: new Date().toISOString()
            });

            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
        } else {
            throw new Error('Invalid response from AI');
        }

    } catch (error) {
        console.error('Error:', error);
        addMessage('AI Assistant', "I apologize, but I'm having trouble connecting at the moment. Please try again.");
    }
}

// Function to add messages to the chatbox
function addMessage(sender, text, subtle = false) {
    const message = document.createElement('div');
    message.className = `message ${subtle ? 'subtle' : ''}`;
    
    let formattedText = text
        .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    message.innerHTML = `<strong>${sender}:</strong> ${formattedText}`;
    chatbox.appendChild(message);
    chatbox.scrollTop = chatbox.scrollHeight;
    
    // Remove subtle messages after a short delay
    if (subtle) {
        setTimeout(() => {
            message.remove();
        }, 2000);
    }
}