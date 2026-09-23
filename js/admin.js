let answerCount = 0;

// ============================
// Get HTML elements
// ============================
const resultsContainer =
    document.getElementById("resultsContainer");

const refreshResultsButton =
    document.getElementById("refreshResultsButton");
	
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

refreshResultsButton.addEventListener(
    "click",
    loadResults
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

    loadResults();
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

async function loadResults()
{
    resultsContainer.innerHTML =
        "<p>Loading results...</p>";

    const {
        data: questionsData,
        error: questionsError
    } =
        await supabaseClient
            .from("questions")
            .select(
                "id, question, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (questionsError)
    {
        console.error(questionsError);

        resultsContainer.innerHTML =
            '<p class="resultsError">' +
            "Failed to load questions: " +
            questionsError.message +
            "</p>";

        return;
    }

    const {
        data: answersData,
        error: answersError
    } =
        await supabaseClient
            .from("answers")
            .select(
                "id, question_id, answer_text, is_correct"
            );

    if (answersError)
    {
        console.error(answersError);

        resultsContainer.innerHTML =
            '<p class="resultsError">' +
            "Failed to load answers: " +
            answersError.message +
            "</p>";

        return;
    }

    const {
        data: resultsData,
        error: resultsError
    } =
        await supabaseClient
            .from("results")
            .select(
                "id, question_id, answer_id, player_name, answer_time, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (resultsError)
    {
        console.error(resultsError);

        resultsContainer.innerHTML =
            '<p class="resultsError">' +
            "Failed to load results: " +
            resultsError.message +
            "</p>";

        return;
    }

    resultsContainer.innerHTML = "";

    if (questionsData.length === 0)
    {
        resultsContainer.innerHTML =
            '<p class="noResults">' +
            "There are no questions yet." +
            "</p>";

        return;
    }

    questionsData.forEach(
        function(question)
        {
            const questionDiv =
                document.createElement("div");

            questionDiv.className =
                "resultQuestion";

            const header =
                document.createElement("div");

            header.className =
                "resultQuestionHeader";

            const title =
                document.createElement("h3");

            title.textContent =
                question.question;

            const deleteButton =
                document.createElement("button");

            deleteButton.type =
                "button";

            deleteButton.className =
                "deleteQuestionButton";

            deleteButton.textContent =
                "Delete Question";

            deleteButton.addEventListener(
                "click",
                function()
                {
                    deleteQuestion(
                        question.id,
                        question.question
                    );
                }
            );

            header.appendChild(title);
            header.appendChild(deleteButton);

            questionDiv.appendChild(header);

            const questionResults =
                resultsData.filter(
                    function(result)
                    {
                        return (
                            result.question_id ===
                            question.id
                        );
                    }
                );

            if (questionResults.length === 0)
            {
                const noResults =
                    document.createElement("p");

                noResults.className =
                    "noResults";

                noResults.textContent =
                    "No answers yet.";

                questionDiv.appendChild(
                    noResults
                );
            }
            else
            {
                questionResults.forEach(
                    function(result)
                    {
                        const resultDiv =
                            document.createElement(
                                "div"
                            );

                        resultDiv.className =
                            "resultRow";

                        const player =
                            document.createElement(
                                "div"
                            );

                        player.className =
                            "resultPlayer";

                        player.textContent =
                            result.player_name;

                        const answer =
							answersData.find(
								function(item)
								{
									return (
										String(item.id) ===
										String(result.answer_id)
									);
								}
							);

                        const answerText =
                            document.createElement(
                                "div"
                            );

                        answerText.className =
                            "resultAnswer";

                        if (answer)
                        {
                            answerText.textContent =
                                "Answer: " +
                                answer.answer_text;

                            const resultType =
                                document.createElement(
                                    "span"
                                );

                            if (answer.is_correct)
                            {
                                resultType.className =
                                    "resultCorrect";

                                resultType.textContent =
                                    " — Correct";
                            }
                            else
                            {
                                resultType.className =
                                    "resultIncorrect";

                                resultType.textContent =
                                    " — Incorrect";
                            }

                            answerText.appendChild(
                                resultType
                            );
                        }
                        else
                        {
                            answerText.textContent =
                                "Answer: Unknown";
                        }

                        const details =
                            document.createElement(
                                "div"
                            );

                        details.className =
                            "resultDetails";

                        const time =
                            (
                                result.answer_time /
                                1000
                            ).toFixed(2);

                        const date =
                            new Date(
                                result.created_at
                            );

                        details.textContent =
                            "Time: " +
                            time +
                            " seconds | " +
                            date.toLocaleString();

                        resultDiv.appendChild(
                            player
                        );

                        resultDiv.appendChild(
                            answerText
                        );

                        resultDiv.appendChild(
                            details
                        );

                        questionDiv.appendChild(
                            resultDiv
                        );
                    }
                );
            }

            resultsContainer.appendChild(
                questionDiv
            );
        }
    );
}

async function deleteQuestion(
    questionId,
    questionText
)
{
    const confirmed =
        confirm(
            "Delete this question?\n\n" +
            questionText +
            "\n\n" +
            "This will also delete all of its answers and results."
        );

    if (!confirmed)
    {
        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from("questions")
            .delete()
            .eq(
                "id",
                questionId
            );

    if (error)
    {
        console.error(error);

        alert(
            "Failed to delete question:\n" +
            error.message
        );

        return;
    }

    loadResults();
}


