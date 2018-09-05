
$(document).ready(function(){
    var numRight               =  0;
    var numWrong               =  0;
    var currentQuestionNum     =  0; // This is the index of the question in triviaQuestions that is currently active.
    var numGameQuestions       = 10; // This is the number of questions that constitute a single game.
    var totalQuestionsAnswered =  0; // This var contains the number of questions that user has currently answered.
    var currentChoice;
    var currentRightAnswer;       // this is the index (in triviaQuestions[].answers[]) of the right answer for a particular question.


    var triviaQuestions = []; /* here's the array of objects to store the questions and answers in*/


        
    /*----------------------------------------------*/
    // Timer Functionality
    /*----------------------------------------------*/
    var intervalID;
    var timer;
    // var timerRunning;
    var msgInterval = 15;


    /*----------------------------------------------*/
    // Database Code
    /*----------------------------------------------*/
    var database; 
    var scores = [];

    // Initialize Firebase
      var config = {
        apiKey: "AIzaSyDXghKHSKVyem-iUc6YXpbS9pDb2osTCmI",
        authDomain: "trivia-game-leaderboard.firebaseapp.com",
        databaseURL: "https://trivia-game-leaderboard.firebaseio.com",
        projectId: "trivia-game-leaderboard",
        storageBucket: "",
        messagingSenderId: "649135365795"
      };
      firebase.initializeApp(config);

    database = firebase.database();


    $("#addScore").on("click", function(event) {
   
      event.preventDefault(); // Don't reset the page!


    //   // Get the initials from form, and number of answers correct from game.
    //   // var initials = $("#initials").val().trim();
    //   // var numberCorrect = $("#number-correct").val().trim();
      


      database.ref().push({
        initials: initials,
        numberCorrect: numberCorrect,
        dateAdded: firebase.database.ServerValue.TIMESTAMP
      })
    });

    /*----------------------------------------------*/

    function startTimer() {
        
            timer=msgInterval;
            intervalID = setInterval(function () {
          
                // console.log(":" + timer);

                if (--timer < 0) {
                    stopTimer();
                }
                $("#myTimer").text("Time Remaining: "+ timer);
            }, 1000);
        
    }

    function resetTimer() {
        clearInterval(intervalID);
    }

    function stopTimer() {
        resetTimer();
        processStateOfPlay(-1,currentRightAnswer);
        getQandA();
    }


    /********************************************************************************/
    /* Utility Functions                                                            */
    /********************************************************************************/

        

    function getRandomInteger(lowerLimit,upperLimit){
                return Math.floor(Math.random()*(upperLimit-lowerLimit+1)+lowerLimit);
    }

    //The next function replaces the &quot;, &#39;, &, and acute accented characters that appear in the Open TDB questions and answers
    //   with their equivalent, displayable character.

    function cleanUpString(inString){
            var cleanString;

            cleanString=inString.replace(/&quot;/g,"\'");
            cleanString=cleanString.replace(/&#039;/g,"\'");
            cleanString=cleanString.replace(/&/g,"");
            cleanString=cleanString.replace(/acute;/g,"");

            return cleanString;
    }

    /*******************************************************************************************************/
    /* Here are the functions that get the questions and answers from OPENTDB, the open trivia database    */
    /* process the json that is returned, and load up the triviaQuestions array of objects that we'll use  */
    /* to play the game.                                                                                   */
    /*******************************************************************************************************/

    function getAnswers(incorrectAnswersArray,correctAnswer,correctPos) {
        var j;
        var tempAnswerString="";
        var finalAnswersArray=[];
        

        // console.log("incorrectAnswersArray is ", incorrectAnswersArray);
        // console.log("Correct Answer is ", correctAnswer);
        // console.log("correctPos is ", correctPos);

        correctAnswer = cleanUpString(correctAnswer);
        for (j = 0; j < incorrectAnswersArray.length; j++) {
            // console.log("j is ",j);
            finalAnswersArray.push(cleanUpString(incorrectAnswersArray[j]));
        }

        if (correctPos ==  finalAnswersArray.length) {
            finalAnswersArray.push(correctAnswer);
        } else {
            tempAnswerString = finalAnswersArray[correctPos];
            finalAnswersArray[correctPos] = correctAnswer;
            finalAnswersArray.push(tempAnswerString);
        }

        return(finalAnswersArray);

    }

    function initQuestions(trivia){
         var i,j;
         var questionString;
         var answerString;
         var correctAnswer;
         var answers=[];
         var correctPos;

          // console.log(trivia);
          for (i=0; i<trivia.results.length; i++){
            if (trivia.results[i].type == "multiple") {
                questionString = cleanUpString(trivia.results[i].question);
                // console.log("Question is ",questionString);
                correctAnswer = trivia.results[i].correct_answer;

                correctPos = getRandomInteger(0,trivia.results[i].incorrect_answers.length);
                answers = getAnswers(trivia.results[i].incorrect_answers,correctAnswer,correctPos);

                triviaQuestions.push(
                    {correctAnswerNum: correctPos,
                     answers: answers,
                     question: questionString,
                    }
                );
            }
                
         }
         // alert("triviaQuestions.length is "+triviaQuestions.length);
         // console.log(triviaQuestions);     
        // We'll get some pictures via REST API call from pixabay.com API 
        
    }

    function resetCounters() {
        // Set the score variables and the current game state counters to 0
        numRight               =  0;
        numWrong               =  0;
        currentQuestionNum     =  0;
        totalQuestionsAnswered =  0;
    }

    function initGame() {
        
        resetCounters();

        // We'll get some questions via ajax from the Open Trivia DB API 
        $.ajax({
          url: "https://opentdb.com/api.php?amount=20&category=23",
          method: "GET"
        }).done(function(trivia) {
            initQuestions(trivia); //and store the questions and answers in our triviaQuestions object.    
        });

        $("#rightAnswers").text("#Right: "+numRight);
        $("#wrongAnswers").text("#Right: "+numWrong);
        $("#answerrowone").hide();
        $("#questions").hide();
        $("#dropdown1").hide();
        $("#bg").css('background-image', 'url(https://upload.wikimedia.org/wikipedia/commons/b/b8/Surrender_of_Lord_Cornwallis.jpg)');
        $("#myQuestion").text("Test Your Historical Knowledge With Our Game!!");
        //initialize all modals           
        //$('.modal').modal();
    }

    /*-----------------------------------------------*/
    /* Functions to actually play game: present a    */
    /* question and answers, take user's guess,      */
    /* process the guess, keep score, transition to  */
    /* new page.                                     */
    /*-----------------------------------------------*/

    // Get the game's questions and answers, as well as the pictures to use for the background
    function getQandA() {

        currentQuestionNum++;

        if (currentQuestionNum >= triviaQuestions.length) {
            // time to start over with the 0th question
            // console.log("resetting currentQuestionNum");
            currentQuestionNum = 0;
        }

        console.log("in getQandA currentQuestionNum is "+currentQuestionNum);
        $("#myQuestion").text(triviaQuestions[currentQuestionNum].question);

        for (var i = 0; i<triviaQuestions[currentQuestionNum].answers.length; i++) {
     
            var answerID = "#answer"+i;

            $(answerID).text(triviaQuestions[currentQuestionNum].answers[i]);
        }
        currentRightAnswer = triviaQuestions[currentQuestionNum].correctAnswerNum;
        
        x = triviaQuestions[currentQuestionNum].answers[currentRightAnswer];


        //  Now, we find a new background photo, using the pixabay API
        var API_KEY = '7024641-dc104f7b2c2ba9ca9bdcc091e';
        var URL = "https://pixabay.com/api/?key="+API_KEY+"&q="+encodeURIComponent(x)+"&image_type=photo"+"&safesearch=true";
        $.getJSON(URL, function(data){
            if (data.hits.length == 0 ){
                $("#bg").css('background-image', 'url(https://upload.wikimedia.org/wikipedia/commons/b/b8/Surrender_of_Lord_Cornwallis.jpg)');
               //JP Updated the cornwallis image to pull in the URL directly from the source.
             } else {
                $("#bg").css('background-image', 'url('+data.hits[0].webformatURL+')');
             }
        });

        resetTimer();
        startTimer();
        
    }

    function gameOver() {
        // Present Game over and user's score
            $("#gameScore").text("Game Score: "+numRight);
            // Reset 
            resetTimer();
            $("#rightAnswers").text("#Right: 0");
            $("#wrongAnswers").text("#Wrong: 0");
            // Ask user whether user wants to enter initials alongside score for leaderboard
            var initials = prompt("Game Over. Enter your name or initials to save your score:");
            var score = numRight;
            console.log("Your score should be " + score);
            console.log(initials);
            database.ref().push({
              initials: initials,
              numberCorrect: score,
              dateAdded: firebase.database.ServerValue.TIMESTAMP
            })
    }

     // Determine whether user gave right or wrong answer, as well as figuring out whether the game is over.

    function processStateOfPlay(currentChoice,currentRightAnswer) {


        if (currentChoice == currentRightAnswer) {
            numRight++;
            $("#rightAnswers").text("#Right: "+numRight);
            $("#gameScore").text("Game Score: "+numRight);
        } else {
            numWrong++;
            $("#wrongAnswers").text("# Wrong: "+numWrong);
        }

        totalQuestionsAnswered++;
        if (totalQuestionsAnswered == numGameQuestions) {
            gameOver();
            resetCounters();
        }

    }


    /*-----------------------------------------------*/
    /* here are the event handling functions.        */
    /*-----------------------------------------------*/

    $(".answerChoice").click(function() {
                    $(this).blur();
                    
                    resetTimer();
                    switch ($(this).attr('id')){
                        
                        case "startGame":
                            currentQuestionNum = -1;
                            resetCounters();
                            $("#questions").show();
                            $("#answerrowone").show();
                            $("#rightAnswers").text("# Right: 0");
                            $("#wrongAnswers").text("# Wrong: 0");
                            $("#gameScore").text("Game Score: 0");
                            $("#bg").css('background-image', 'url(https://upload.wikimedia.org/wikipedia/commons/b/b8/Surrender_of_Lord_Cornwallis.jpg)');
                            getQandA();
                            break;

                        case "saveGame":
                            console.log("Saving Game");
                            gameOver();
                            break;

                        case "helpButton":
                            break;

                        case "answer0":
                            currentChoice  = $(this).attr('value');
                           
                            processStateOfPlay(currentChoice,currentRightAnswer);
                            getQandA();
                            
                            break;
                        case "answer1":
                            currentChoice  = $(this).attr('value');

                            processStateOfPlay(currentChoice,currentRightAnswer);
                            getQandA();
                           
                            break;
                        case "answer2":
                            currentChoice  = $(this).attr('value');
                  
                            processStateOfPlay(currentChoice,currentRightAnswer);
                            getQandA();
                            
                            break;
                        case "answer3":
                            currentChoice  = $(this).attr('value');
                            
                            processStateOfPlay(currentChoice,currentRightAnswer);
                            getQandA();
                            
                            break;

                        
                        case "gameScore":
                            console.log("Found gameScore");

                            break;

                        default:
                            
                            getQandA();
                           
                            break;
                    }
                    
    });



    /*-------------------------------------------*/
    /* and here's the code */
    /* that calls the code to initial the game   */
    /*-------------------------------------------*/

    initGame();

});