// Participant data
let participantID = '';
let participantData = [];

// Trial variables
let currentSetIndex = 0;
let currentTrialIndex = 0;
let currentSet = null;
let mathStartTime = 0;
let mathResponseTimeout = null;

// Constants
const totalSets = 15; // 3 sets for each set size (3-7)
const setSizes = [3, 4, 5, 6, 7];
const letters = ["F", "H", "J", "K", "L", "N", "P", "Q", "R", "S", "T", "Y"];

// Generate trial sets
let trialSets = [];
generateTrialSets();

// Show participant ID input
document.getElementById("participant-id-section").style.display = "block";

// Functions

function showInstructions() {
    participantID = document.getElementById("participant-id").value.trim();
    if (participantID === '') {
        alert('参加者IDを入力してください。');
        return;
    }
    document.getElementById("participant-id-section").style.display = "none";
    document.getElementById("instructions").style.display = "block";
}

function startPractice() {
    document.getElementById("instructions").style.display = "none";
    startTest(true); // Start practice session
}

function startTest(isPractice = false) {
    if (isPractice) {
        alert('練習セッションを開始します。');
        trialSets = generatePracticeSets();
    } else {
        trialSets = generateTrialSets();
    }
    currentSetIndex = 0;
    currentTrialIndex = 0;
    participantData = []; // Reset data
    nextTrial();
}

function nextTrial() {
    if (currentSetIndex >= trialSets.length) {
        if (trialSets[0].isPractice) {
            // Practice session over, start real test
            alert('練習セッションが終了しました。テストを開始します。');
            trialSets = generateTrialSets(); // Generate real trial sets
            currentSetIndex = 0;
            currentTrialIndex = 0;
            participantData = []; // Reset data
            nextTrial();
        } else {
            // Test over
            endTest();
        }
        return;
    }

    currentSet = trialSets[currentSetIndex];
    currentTrialIndex = 0;
    currentSet.responses = [];
    nextMathProblem();
}

function nextMathProblem() {
    if (currentTrialIndex >= currentSet.setSize) {
        // Proceed to recall phase
        showRecall();
        return;
    }

    const problem = generateMathProblem();
    currentSet.currentProblem = problem;

    document.getElementById("math-question").innerText = problem.question;
    document.getElementById("current-trial").innerText = getCurrentTrialNumber();
    document.getElementById("total-trials").innerText = getTotalTrials();

    document.getElementById("math-problem").style.display = "block";
    mathStartTime = performance.now();

    // Set a time limit (e.g., 5 seconds)
    mathResponseTimeout = setTimeout(() => {
        recordMathResponse(null, false, true);
        showLetter();
    }, 5000); // 5000 milliseconds
}

function checkAnswer(userChoice) {
    clearTimeout(mathResponseTimeout);
    const responseTime = performance.now() - mathStartTime;
    const isCorrect = (userChoice === currentSet.currentProblem.isCorrect);

    recordMathResponse(userChoice, isCorrect, false, responseTime);

    showLetter();
}

function recordMathResponse(userChoice, isCorrect, timedOut, responseTime = null) {
    currentSet.responses.push({
        mathProblem: currentSet.currentProblem.question,
        mathIsCorrect: currentSet.currentProblem.isCorrect,
        userAnswer: userChoice,
        mathResponseCorrect: isCorrect,
        mathTimedOut: timedOut,
        mathReactionTime: responseTime,
        presentedLetter: currentSet.letters[currentTrialIndex],
    });
}

function showLetter() {
    document.getElementById("math-problem").style.display = "none";
    document.getElementById("letter-display").style.display = "block";
    const letter = currentSet.letters[currentTrialIndex];
    document.getElementById("letter").innerText = letter;

    setTimeout(() => {
        document.getElementById("letter-display").style.display = "none";
        currentTrialIndex++;
        nextMathProblem();
    }, 800); // 800 milliseconds
}

function showRecall() {
    document.getElementById("math-problem").style.display = "none";
    document.getElementById("letter-display").style.display = "none";
    document.getElementById("recall-phase").style.display = "block";

    // Generate letter buttons
    const recallOptions = document.getElementById("recall-options");
    recallOptions.innerHTML = '';
    letters.forEach(letter => {
        const button = document.createElement("button");
        button.innerText = letter;
        button.onclick = () => selectLetter(button);
        recallOptions.appendChild(button);
    });

    document.getElementById("selected-letters").innerText = '';
    currentSet.selectedLetters = [];
}

function selectLetter(button) {
    const letter = button.innerText;
    if (currentSet.selectedLetters.length >= currentSet.setSize) {
        alert('これ以上選択できません。');
        return;
    }
    currentSet.selectedLetters.push(letter);
    document.getElementById("selected-letters").innerText = currentSet.selectedLetters.join(' ');
}

function submitRecall() {
    if (currentSet.selectedLetters.length !== currentSet.setSize) {
        alert('すべてのアルファベットを選択してください。');
        return;
    }

    // Compare selected letters with presented letters
    let correctCount = 0;
    for (let i = 0; i < currentSet.setSize; i++) {
        if (currentSet.letters[i] === currentSet.selectedLetters[i]) {
            correctCount++;
        }
    }
    currentSet.recallCorrectCount = correctCount;

    // Store data
    participantData.push({
        setNumber: currentSetIndex + 1,
        setSize: currentSet.setSize,
        isPractice: currentSet.isPractice,
        responses: currentSet.responses,
        selectedLetters: currentSet.selectedLetters,
        presentedLetters: currentSet.letters,
        recallCorrectCount: correctCount
    });

    // Show feedback
    showFeedback();
}

function showFeedback() {
    document.getElementById("recall-phase").style.display = "none";
    document.getElementById("feedback").style.display = "block";

    const totalMathCorrect = currentSet.responses.filter(r => r.mathResponseCorrect).length;
    const totalMath = currentSet.responses.length;
    const feedbackText = `数学の問題: ${totalMathCorrect}/${totalMath} 正解\n` +
        `リコール: ${currentSet.recallCorrectCount}/${currentSet.setSize} 正解`;

    document.getElementById("feedback-text").innerText = feedbackText;
}

function proceed() {
    document.getElementById("feedback").style.display = "none";
    currentSetIndex++;
    currentTrialIndex = 0;
    nextTrial();
}

function endTest() {
    alert('テストが終了しました。お疲れ様でした！データを保存します。');
    exportData();
    // Optionally, redirect or reset the test
}

function exportData() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ParticipantID,SetNumber,SetSize,IsPractice,TrialNumber,MathProblem,MathIsCorrect,UserAnswer,MathResponseCorrect,MathTimedOut,MathReactionTime,PresentedLetter,SelectedLetter,RecallCorrect\n";

    participantData.forEach(setData => {
        setData.responses.forEach((trial, index) => {
            csvContent += `${participantID},${setData.setNumber},${setData.setSize},${setData.isPractice},${index + 1},` +
                `"${trial.mathProblem}",${trial.mathIsCorrect},${trial.userAnswer},${trial.mathResponseCorrect},${trial.mathTimedOut},${trial.mathReactionTime},${trial.presentedLetter},${setData.selectedLetters[index] || ''},${setData.recallCorrectCount}\n`;
        });
    });

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${participantID}_ospan_data.csv`);
    document.body.appendChild(link);
    link.click();
}

function getCurrentTrialNumber() {
    let trialNumber = 0;
    for (let i = 0; i < currentSetIndex; i++) {
        trialNumber += trialSets[i].setSize;
    }
    trialNumber += currentTrialIndex + 1;
    return trialNumber;
}

function getTotalTrials() {
    let total = 0;
    trialSets.forEach(set => {
        total += set.setSize;
    });
    return total;
}

function generateTrialSets() {
    let sets = [];
    for (let i = 0; i < 3; i++) { // 3 repetitions
        setSizes.forEach(size => {
            sets.push({
                setSize: size,
                isPractice: false,
                letters: getRandomLetters(size),
                responses: []
            });
        });
    }
    // Shuffle sets
    sets = shuffleArray(sets);
    return sets;
}

function generatePracticeSets() {
    let sets = [];
    sets.push({
        setSize: 2,
        isPractice: true,
        letters: getRandomLetters(2),
        responses: []
    });
    return sets;
}

function getRandomLetters(n) {
    let shuffledLetters = shuffleArray([...letters]);
    return shuffledLetters.slice(0, n);
}

function generateMathProblem() {
    let num1 = getRandomInt(1, 9);
    let num2 = getRandomInt(1, 9);
    let num3 = getRandomInt(1, 9);
    let operations = ['+', '-', '*'];
    let op1 = operations[getRandomInt(0, operations.length - 1)];
    let op2 = operations[getRandomInt(0, operations.length - 1)];

    let expression = `(${num1} ${op1} ${num2}) ${op2} ${num3}`;
    let correctAnswer = eval(expression);

    // Randomly decide if the displayed answer is correct
    let isCorrect = Math.random() < 0.5;
    let displayedAnswer = isCorrect ? correctAnswer : correctAnswer + getRandomInt(-3, 3);

    return {
        question: `${expression.replace('*', '×')} = ${displayedAnswer}`,
        isCorrect: isCorrect
    };
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // Swap with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
