let answerCount = 0;

// ============================
// Get HTML elements
// ============================

const loginScreen =
document.getElementById("loginScreen");

const adminScreen =
document.getElementById("adminScreen");

const loginButton =
document.getElementById("loginButton");

const logoutButton =
document.getElementById("logoutButton");

const loginError =
document.getElementById("loginError");

const addAnswerButton =
document.getElementById("addAnswerButton");

const saveQuestionButton =
document.getElementById("saveQuestionButton");

const answersContainer =
document.getElementById("answers");

const statusText =
document.getElementById("status");

// ============================
// Check existing login
// ============================

checkLogin();

// ============================
// Login
// ============================

loginButton.addEventListener(
"click",
login
);

async function login()
{
const email =
document.getElementById("email")
.value
.trim();


const password =
    document.getElementById("password")
        .value;

loginError.textContent = "";

if (
    email === "" ||
    password === ""
)
{
    loginError.textContent =
        "Enter your email and password.";

    return;
}


loginButton.disabled = true;

loginButton.textContent =
    "Logging in...";


const { data, error } =
    await supabaseClient.auth
        .signInWithPassword({
            email: email,
            password: password
        });


if (error)
{
    console.error(error);

    loginError.textContent =
        error.message;

    loginButton.disabled = false;

    loginButton.textContent =
        "Login";

    return;
}


showAdminScreen();


loginButton.disabled = false;

loginButton.textContent =
    "Login";


}

// ============================
// Check existing session
// ============================

async function checkLogin()
{
const { data, error } =
await supabaseClient.auth.getSession();


if (error)
{
    console.error(error);
    return;
}


if (data.session)
{
    showAdminScreen();
}


}

// ============================
// Show admin screen
// ============================

function showAdminScreen()
{
loginScreen.style.display =
"none";


adminScreen.style.display =
    "block";


if (answerCount === 0)
{
    addAnswer();
}


}

// ============================
// Logout
// ============================

logoutButton.addEventListener(
"click",
async function()
{
await supabaseClient.auth.signOut();


    adminScreen.style.display =
        "none";

    loginScreen.style.display =
        "flex";

    answersContainer.innerHTML = "";

    answerCount = 0;
}


);

// ============================
// Add answer
// ============================

addAnswerButton.addEventListener(
"click",
addAnswer
);

function addAnswer()
{
answerCount++;


const answerDiv =
    document.createElement("div");

answerDiv.className =
    "answerRow";


const number =
    document.createElement("span");

number.className =
    "answerNumber";

number.textContent =
    answerCount + ".";


const input =
    document.createElement("input");

input.type =
    "text";

input.className =
    "answerInput";

input.placeholder =
    "Answer " + answerCount;


answerDiv.appendChild(
    number
);

answerDiv.appendChild(
    input
);


// The first answer is always correct.

if (answerCount === 1)
{
    const correctLabel =
        document.createElement("span");

    correctLabel.className =
        "correctLabel";

    correctLabel.textContent =
        "Correct";

    answerDiv.appendChild(
        correctLabel
    );
}


answersContainer.appendChild(
    answerDiv
);


}

// ============================
// Save question
// ============================

saveQuestionButton.addEventListener(
"click",
saveQuestion
);

async function saveQuestion()
{
statusText.textContent = "";


const questionInput =
    document.getElementById(
        "questionText"
    );


const questionText =
    questionInput.value.trim();


if (questionText === "")
{
    statusText.textContent =
        "Enter a question.";

    return;
}


const answerInputs =
    document.querySelectorAll(
        ".answerInput"
    );


if (answerInputs.length < 2)
{
    statusText.textContent =
        "Add at least two answers.";

    return;
}


const answers = [];


for (
    let i = 0;
    i < answerInputs.length;
    i++
)
{
    const text =
        answerInputs[i]
            .value
            .trim();


    if (text === "")
    {
        statusText.textContent =
            "All answers must have text.";

        return;
    }


    answers.push({
        answer_text: text,

        is_correct:
            i === 0
    });
}


saveQuestionButton.disabled =
    true;

saveQuestionButton.textContent =
    "Saving...";


// ============================
// Insert question
// ============================

const {
    data: questionData,
    error: questionError
} =
    await supabaseClient
        .from("questions")
        .insert({
            question: questionText
        })
        .select()
        .single();


if (questionError)
{
    console.error(questionError);

    statusText.textContent =
        "Failed to save question: " +
        questionError.message;

    saveQuestionButton.disabled =
        false;

    saveQuestionButton.textContent =
        "Save Question";

    return;
}


// ============================
// Insert answers
// ============================

const answersToInsert =
    answers.map(function(answer)
    {
        return {
            question_id:
                questionData.id,

            answer_text:
                answer.answer_text,

            is_correct:
                answer.is_correct
        };
    });


const {
    error: answersError
} =
    await supabaseClient
        .from("answers")
        .insert(
            answersToInsert
        );


if (answersError)
{
    console.error(answersError);

    statusText.textContent =
        "Question was created, but answers failed: " +
        answersError.message;

    saveQuestionButton.disabled =
        false;

    saveQuestionButton.textContent =
        "Save Question";

    return;
}


// ============================
// Success
// ============================

statusText.textContent =
    "Question saved successfully!";


questionInput.value = "";

answersContainer.innerHTML = "";

answerCount = 0;

addAnswer();


saveQuestionButton.disabled =
    false;

saveQuestionButton.textContent =
    "Save Question";


}
