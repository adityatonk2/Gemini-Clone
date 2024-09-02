const typingForm = document.querySelector('.typing-form');
const chatList = document.querySelector('.chat-list');
const suggestions = document.querySelectorAll('.suggestions-list .suggestion');
const toggleThemeButton = document.querySelector('#toggle-theme-button');
const deleteChatButton = document.querySelector('#delete-chat-button');

let userMessage = null;
let isResponseGenerating = false;

//API configuration 
const API_KEY = "AIzaSyC8SfM4MJ0ntOTsUUYp2dtry6E5H4vRCOM";

let API_url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorage = () => {
    const savedChats= localStorage.getItem('savedChats');
    const isLightMode = (localStorage.getItem('themeColor') === 'light_mode');

    //apply the stored theme
    document.body.classList.toggle('light_mode',isLightMode);
    toggleThemeButton.innerText = isLightMode ? 'dark_mode' : 'light_mode' ;

    chatList.innerHTML = savedChats || '';
    document.body.classList.toggle('hide-header', savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
};

loadLocalStorage();

const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div;
};
// Show typing effect by showing words one by one 
    const showTypingEffect = (text, textElement,incomingMessageDiv) => {
        const words = text.split(' ');
        let currentWordIndex = 0;

        const typingInterval = setInterval(() => {
            // Append each word with a space
            textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++] ;
            incomingMessageDiv.querySelector('.icon').classList.add('hide');
            if(currentWordIndex === words.length ) {
                clearInterval(typingInterval);
                isResponseGenerating = false;
                incomingMessageDiv.querySelector('.icon').classList.add('remove');
                localStorage.setItem('savedChats',chatList.innerHTML); //saved chats to local storage
            }
            chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
        },75);
    };
    
//generating api response with users input 
const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector('.text'); //get text element 
    //send a post request to API with users message
   try {
    const response = await  fetch(API_url,{
        method: "POST", 
        headers: {'Content-Type' : 'application/json'},
        body : JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{text: userMessage}]
          }]
        })
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.error.message);
    const apiResponse =  data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement,incomingMessageDiv);

   } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error;
    textElement.classList.add("error");
   }
   finally {
    incomingMessageDiv.classList.remove('loading');
   }
};

// showing loading animation while waiting for api response
const showLoadAnimation = () => {
    const html=(` <div class="message-content">
                <img src="gemini.jpeg" alt="gemini" class="avatar" />
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
                 </div>
                 <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`);
      const incomingMessageDiv = createMessageElement(html ,'incoming','loading');
      incomingMessageDiv.querySelector('.text').innerText = ""; 
      chatList.appendChild(incomingMessageDiv);

      chatList.scrollTo(0, chatList.scrollHeight); // scroll to the bottom
      generateAPIResponse(incomingMessageDiv);
  
 };

// copy message to the clipboard
const copyMessage = (copyIcon) => {
  const message = copyIcon.parentElement.querySelector('.text').innerText;
  navigator.clipboard.writeText(message);
  copyIcon.innerText = 'done';
  setTimeout(() => copyIcon.innerText = 'content_copy', 1000); //Revert Icon After 1 second
}
  
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector('.typing-input').value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return; //Exit if there is no user message 

    isResponseGenerating = true;

    const html=(` <div class="message-content">
                <img src="user.png" alt="user" class="avatar" />
                <p class="text"></p>
            </div>`);
      const createOutgoingDiv = createMessageElement(html ,'outgoing');
      createOutgoingDiv.querySelector('.text').innerText = userMessage; 
      chatList.appendChild(createOutgoingDiv);

      typingForm.reset(); //clear the form input
      chatList.scrollTo(0, chatList.scrollHeight);
      document.body.classList.add('hide-header'); // hide the header once chat start
      setTimeout(showLoadAnimation, 500) //loadinga animation after delay
};
//toggle button for theme switch
toggleThemeButton.addEventListener('click',(e) => {
    const isLightMode = document.body.classList.toggle('light_mode');
    localStorage.setItem('themeColor',isLightMode ? 'light_mode' : 'dark_mode');
    toggleThemeButton.innerText = isLightMode ? 'dark_mode' : 'light_mode' ;
});

//set user message and handle outgoing chat when suggestion is clicked 

suggestions.forEach((suggestion) => {
    suggestion.addEventListener('click', () => {
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
})

//delete chat button
deleteChatButton.addEventListener('click', () => {
    if(confirm("Are you sure want to delete the chat ??")){
        localStorage.removeItem('savedChats');
        loadLocalStorage(); 
    }
})

// prevent default submisson and handle outgoing message
typingForm.addEventListener('submit',(e) => {
    e.preventDefault();
    
    handleOutgoingChat();
});