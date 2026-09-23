let questions = [];
let currentQuestionIndex = 0;

let playerName = "";

let questionStartTime = 0;
let selectedAnswer = null;

/*
    Stores the answer currently selected for each question.

    This is remembered even before the answer is submitted.
*/
let selectedAnswers = new Map();

/*
    Stores the answer that was actually submitted
    for each question.
*/
let answeredQuestions = new Map();



document
    .getElementById("startButton")
    .addEventListener(
        "click",
        startQuiz
    );


async function startQuiz()
{
    const nameInput =
        document.getElementById("playerName");

    playerName =
        nameInput.value.trim();

    if (playerName === "")
    {
        alert("Please enter your name.");
        return;
    }

    const startButton =
        document.getElementById("startButton");

    startButton.disabled = true;
    startButton.textContent = "Loading...";

    const { data, error } =
        await supabaseClient
            .from("questions")
            .select(`
                id,
                question,
                answers (
                    id,
                    answer_text,
                    is_correct
                )
            `)
            .order("id", {
                ascending: false
            });

    if (error)
    {
        console.error(error);

        alert(
            "Failed to load questions:\n" +
            error.message
        );

        startButton.disabled = false;
        startButton.textContent = "Start Quiz";

        return;
    }

    if (!data || data.length === 0)
    {
        alert(
            "There are no questions in the database."
        );

        startButton.disabled = false;
        startButton.textContent = "Start Quiz";

        return;
    }

    questions = data;

    currentQuestionIndex = 0;

    answeredQuestions.clear();

    document.getElementById("nameScreen").style.display =
        "none";

    document.getElementById("quizScreen").style.display =
        "block";

    createQuestionSelector();

    showQuestion();
}


function createQuestionSelector()
{
    const selector =
        document.getElementById(
            "questionSelector"
        );

    selector.innerHTML = "";

    for (
        let i = 0;
        i < questions.length;
        i++
    )
    {
        const option =
            document.createElement("option");

        option.value = i;

        option.textContent =
            "Question " +
            (questions.length - i);

        selector.appendChild(option);
    }

    selector.value = currentQuestionIndex;

    selector.onchange =
        function()
        {
            currentQuestionIndex =
                Number(selector.value);

            showQuestion();
        };
}

function showQuestion()
{
    const question =
        questions[currentQuestionIndex];

    document.getElementById(
        "questionText"
    ).textContent =
        question.question;

    const answersContainer =
        document.getElementById("answers");

    answersContainer.innerHTML = "";

    selectedAnswer = null;

    const nextButton =
        document.getElementById("nextButton");

    nextButton.disabled = true;

    nextButton.textContent =
        "Submit Answer";

    /*
        Check if this question was already submitted.
    */
    const savedAnswerId =
        answeredQuestions.get(
            question.id
        );

    const alreadyAnswered =
        savedAnswerId !== undefined;

    /*
        Check if the player selected an answer
        before switching to another question.
    */
    const savedSelectedAnswerId =
        selectedAnswers.get(
            question.id
        );

    /*
        Make a copy of the answers.

        This lets us shuffle the buttons without
        changing the answers stored in the question.
    */
    const shuffledAnswers =
        [...question.answers];

    shuffledAnswers.sort(
        function()
        {
            return Math.random() - 0.5;
        }
    );

    /*
        Create one button for every answer.
    */
    shuffledAnswers.forEach(
        function(answer)
        {
            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent =
                answer.answer_text;

            button.className =
                "answerButton";

            /*
                The question has already been submitted.
            */
            if (alreadyAnswered)
            {
                button.disabled = true;

                /*
                    Show the correct answer.
                */
                if (answer.is_correct)
                {
                    button.classList.add(
                        "correct"
                    );
                }

                /*
                    Show the answer the player chose.
                */
                if (
                    answer.id ===
                    savedAnswerId
                )
                {
                    button.classList.add(
                        "selected"
                    );

                    /*
                        If the selected answer was wrong,
                        show it as incorrect too.
                    */
                    if (!answer.is_correct)
                    {
                        button.classList.add(
                            "incorrect"
                        );
                    }
                }
            }
            else
            {
                /*
                    Restore a selection that was made
                    before switching questions.
                */
                if (
                    answer.id ===
                    savedSelectedAnswerId
                )
                {
                    button.classList.add(
                        "selected"
                    );

                    selectedAnswer =
                        answer;

                    nextButton.disabled =
                        false;
                }

                /*
                    Allow the user to select this answer.
                */
                button.addEventListener(
                    "click",
                    function()
                    {
                        selectAnswer(
                            answer,
                            button
                        );
                    }
                );
            }

            answersContainer.appendChild(
                button
            );
        }
    );

    if (alreadyAnswered)
    {
        showSavedMessage();
    }
    else
    {
        clearSavedMessage();
    }

    /*
        Keep the question selector synchronized.
    */
    document.getElementById(
        "questionSelector"
    ).value =
        currentQuestionIndex;

    /*
        Start timing this question.
    */
    questionStartTime =
        performance.now();
}





function selectAnswer(
    answer,
    button
)
{
    if (selectedAnswer !== null)
    {
        return;
    }

    selectedAnswer = answer;

    /*
        Remember the selected answer for this question.

        This happens before submitting the result.
    */
    selectedAnswers.set(
        questions[currentQuestionIndex].id,
        answer.id
    );

    /*
        Mark the selected answer visually.
    */
    button.classList.add("selected");

    const answerButtons =
        document.querySelectorAll(
            ".answerButton"
        );

    /*
        Prevent selecting another answer.
    */
    answerButtons.forEach(
        function(element)
        {
            element.disabled = true;
        }
    );

    document.getElementById(
        "nextButton"
    ).disabled = false;
}




async function nextQuestion()
{
    if (selectedAnswer === null)
    {
        return;
    }

    const question =
        questions[currentQuestionIndex];

    const elapsedTime =
        Math.round(
            performance.now() -
            questionStartTime
        );

    /*
        Save the result to Supabase.
    */
    const { error } =
        await supabaseClient
            .from("results")
            .insert({
                player_name: playerName,

                question_id:
                    question.id,

                answer_id:
                    selectedAnswer.id,

                answer_time:
                    elapsedTime
            });

    /*
        The database unique constraint prevents
        the same player/question combination
        from being saved twice.
    */
    if (error)
    {
        console.error(
            "Failed to save result:",
            error
        );

        if (error.code === "23505")
        {
            /*
                The result already exists.
                Remember the answer that was selected
                during this session.
            */
            answeredQuestions.set(
                question.id,
                selectedAnswer.id
            );

            showQuestion();

            showSavedMessage(
                "This question was already answered."
            );

            return;
        }

        alert(
            "Failed to save result:\n" +
            error.message
        );

        return;
    }

    /*
        Remember which answer was selected.

        This lets us show the same result if the
        player comes back to this question later.
    */
    answeredQuestions.set(
        question.id,
        selectedAnswer.id
    );

    /*
        NOW show the correct and wrong answers.
    */
    showAnswerResult();

    /*
        Tell the player that the result was saved.
    */
    showSavedMessage();
}


function showAnswerResult()
{
    const question =
        questions[currentQuestionIndex];

    const answerButtons =
        document.querySelectorAll(
            ".answerButton"
        );

    answerButtons.forEach(
        function(button)
        {
            const answer =
                question.answers.find(
                    function(item)
                    {
                        return (
                            item.answer_text ===
                            button.textContent
                        );
                    }
                );

            if (!answer)
            {
                return;
            }

            /*
                Mark the correct answer.
            */
            if (answer.is_correct)
            {
                button.classList.add(
                    "correct"
                );
            }

            /*
                Mark the answer that the player chose.
            */
            if (
                answer.id ===
                selectedAnswer.id
            )
            {
                button.classList.add(
                    "selected"
                );

                /*
                    If the selected answer was wrong,
                    mark it red.
                */
                if (!answer.is_correct)
                {
                    button.classList.add(
                        "incorrect"
                    );
                }
            }
        }
    );

    document.getElementById(
        "nextButton"
    ).disabled = true;

    document.getElementById(
        "nextButton"
    ).textContent = "Result Saved";
}


function showSavedMessage(
    message = "Result saved!"
)
{
    let messageElement =
        document.getElementById(
            "resultSavedMessage"
        );

    if (!messageElement)
    {
        messageElement =
            document.createElement("p");

        messageElement.id =
            "resultSavedMessage";

        messageElement.style.textAlign =
            "center";

        messageElement.style.fontWeight =
            "bold";

        document.getElementById(
            "nextButton"
        ).insertAdjacentElement(
            "afterend",
            messageElement
        );
    }

    messageElement.textContent =
        message;
}


function clearSavedMessage()
{
    const messageElement =
        document.getElementById(
            "resultSavedMessage"
        );

    if (messageElement)
    {
        messageElement.textContent = "";
    }
}


document
    .getElementById("nextButton")
    .addEventListener(
        "click",
        nextQuestion
    );


document
    .getElementById("restartButton")
    .addEventListener(
        "click",
        function()
        {
            location.reload();
        }
    );

