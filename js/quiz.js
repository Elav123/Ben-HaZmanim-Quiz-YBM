let questions = [];

let currentQuestionIndex = 0;

let playerName = "";

let selectedAnswers =
    new Map();

let answeredQuestions =
    new Map();

let questionStartTime = 0;


const nameScreen =
    document.getElementById(
        "nameScreen"
    );

const quizScreen =
    document.getElementById(
        "quizScreen"
    );

const resultScreen =
    document.getElementById(
        "resultScreen"
    );

const playerNameInput =
    document.getElementById(
        "playerName"
    );

const startButton =
    document.getElementById(
        "startButton"
    );

const questionText =
    document.getElementById(
        "questionText"
    );

const answersContainer =
    document.getElementById(
        "answers"
    );

const nextButton =
    document.getElementById(
        "nextButton"
    );

const resultText =
    document.getElementById(
        "resultText"
    );

const restartButton =
    document.getElementById(
        "restartButton"
    );

const questionSelector =
    document.getElementById(
        "questionSelector"
    );


startButton.addEventListener(
    "click",
    startQuiz
);

nextButton.addEventListener(
    "click",
    nextQuestion
);

restartButton.addEventListener(
    "click",
    returnToLogin
);

questionSelector.addEventListener(
    "change",
    function()
    {
        currentQuestionIndex =
            Number(
                questionSelector.value
            );

        showQuestion();
    }
);


async function startQuiz()
{
    playerName =
        playerNameInput.value.trim();

    if (playerName === "")
    {
        alert(
            "Please enter your name."
        );

        return;
    }

    startButton.disabled =
        true;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("questions")
            .select(
                `
                id,
                question,
                answers (
                    id,
                    answer_text,
                    is_correct
                )
                `
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );

    startButton.disabled =
        false;

    if (error)
    {
        console.error(error);

        alert(
            "Failed to load questions:\n" +
            error.message
        );

        return;
    }

    if (
        !data ||
        data.length === 0
    )
    {
        alert(
            "There are no questions yet."
        );

        return;
    }

    questions =
        data;

    /*
     * Start on the last question.
     */
    currentQuestionIndex =
        questions.length - 1;

    selectedAnswers.clear();

    answeredQuestions.clear();

    nameScreen.style.display =
        "none";

    resultScreen.style.display =
        "none";

    quizScreen.style.display =
        "block";

    createQuestionSelector();

    showQuestion();
}


function createQuestionSelector()
{
    questionSelector.innerHTML =
        "";

    questions.forEach(
        function(question, index)
        {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                index;

            option.textContent =
                "Question " +
                (index + 1);

            questionSelector.appendChild(
                option
            );
        }
    );

    questionSelector.value =
        currentQuestionIndex;
}


function showQuestion()
{
    if (
        questions.length === 0
    )
    {
        return;
    }

    const question =
        questions[
            currentQuestionIndex
        ];

    questionText.textContent =
        question.question;

    answersContainer.innerHTML =
        "";

    nextButton.disabled =
        true;

    nextButton.textContent =
        "Submit Answer";

    questionSelector.value =
        currentQuestionIndex;

    const previousAnswer =
        selectedAnswers.get(
            question.id
        );

    question.answers.forEach(
        function(answer)
        {
            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "answerButton";

            button.textContent =
                answer.answer_text;

            button.dataset.answerId =
                answer.id;

            if (
                previousAnswer ===
                answer.id
            )
            {
                button.classList.add(
                    "selected"
                );

                nextButton.disabled =
                    false;
            }

            button.addEventListener(
                "click",
                function()
                {
                    selectAnswer(
                        question.id,
                        answer.id
                    );
                }
            );

            answersContainer.appendChild(
                button
            );
        }
    );

    questionStartTime =
        Date.now();
}


function selectAnswer(
    questionId,
    answerId
)
{
    selectedAnswers.set(
        questionId,
        answerId
    );

    const buttons =
        answersContainer.querySelectorAll(
            ".answerButton"
        );

    buttons.forEach(
        function(button)
        {
            button.classList.remove(
                "selected"
            );

            if (
                String(
                    button.dataset.answerId
                ) ===
                String(answerId)
            )
            {
                button.classList.add(
                    "selected"
                );
            }
        }
    );

    nextButton.disabled =
        false;
}


async function nextQuestion()
{
    const question =
        questions[
            currentQuestionIndex
        ];

    if (!question)
    {
        return;
    }

    const selectedAnswerId =
        selectedAnswers.get(
            question.id
        );

    if (
        selectedAnswerId ===
        undefined
    )
    {
        return;
    }

    nextButton.disabled =
        true;

    const answerTime =
        Date.now() -
        questionStartTime;

    const {
        error
    } =
        await supabaseClient
            .from("results")
            .insert(
                {
                    player_name:
                        playerName,
                    question_id:
                        question.id,
                    answer_id:
                        selectedAnswerId,
                    answer_time:
                        answerTime
                }
            );

    if (error)
    {
        console.error(error);

        /*
         * 23505 means that this player
         * already submitted this question.
         */
        if (
            error.code ===
            "23505"
        )
        {
            answeredQuestions.set(
                question.id,
                selectedAnswerId
            );

            setTimeout(
                finishQuiz,
                2000
            );

            return;
        }

        alert(
            "Failed to save answer:\n" +
            error.message
        );

        nextButton.disabled =
            false;

        return;
    }

    answeredQuestions.set(
        question.id,
        selectedAnswerId
    );

    /*
     * The quiz finishes after submitting
     * any one question.
     */
    setTimeout(
        finishQuiz,
        2000
    );
}


function finishQuiz()
{
    quizScreen.style.display =
        "none";

    resultScreen.style.display =
        "block";

    resultText.textContent =
        "Your answer has been submitted.";

    setTimeout(
        returnToLogin,
        2000
    );
}


function returnToLogin()
{
    resultScreen.style.display =
        "none";

    quizScreen.style.display =
        "none";

    nameScreen.style.display =
        "flex";

    playerNameInput.value =
        "";

    questions = [];

    currentQuestionIndex =
        0;

    playerName =
        "";

    selectedAnswers.clear();

    answeredQuestions.clear();

    answersContainer.innerHTML =
        "";

    questionText.textContent =
        "Question";

    questionSelector.innerHTML =
        "";

    nextButton.disabled =
        true;

    nextButton.textContent =
        "Submit Answer";

    resultText.textContent =
        "Your score will appear here.";

    startButton.disabled =
        false;
}

