let local_entries
let local_audio
let local_targetWord

//-----------------------------------------------------------
function card(entry)
{
    return '<div class="card bg-danger position-relative">' +
        //' <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info">99</span>
        '<div class="card-body">' +
            '<h3 class="card-title">' + entry.name +'</h3>' +
            '<p class="card-text small">' + entry.detail + '</p>' +
            '<div>' + 
            '<a href="#" class="btn" style="background-color:#fdfecd; color: #2d0a0a" onclick="startQuiz(\'' + entry.cat + '\', true)">Begin</a>' +
            '<a href="#" name=\"' + entry.cat + '-resume\"' + ' class="btn mx-5 px-2 invisible" style="background-color:#fdbecd; color: #2d0a0a" onclick="startQuiz(\'' + entry.cat + '\', false)">Resume</a>' +
            '</div>' +
        '</div>' +
    '</div>'
}

//-----------------------------------------------------------
function mainMenu()
{
    bundles = [
        {
            "cat": "School 1",
            "name": "School Level 1",
            "description": "2025 School Spelling Bee Study List: 1st, 2nd and 3rd Grade Words",
            "detail": "150 words perfect for beginning spellers or students in grades 1-3."
        },
        {
            "cat": "School 2",
            "name": "School Level 2",
            "description": "2025 School Spelling Bee Study List: 4th, 5th and 6th Grade Words",
            "detail": "150 words to inspire beginning and intermediate spellers or students in grades 4-6."
        },
        {
            "cat": "School 3",
            "name": "School Level 3",
            "description": "2025 School Spelling Bee Study List: 7th and 8th Grade Words",
            "detail": "Finish the School Spelling Bee Study list with 150 challenging words for 7th and 8th graders."
        },
        {
            "cat": "1",
            "name": "Champion Level 1",
            "description": "2025 School Spelling Bee Study List: 1st, 2nd and 3rd Grade Words",
            "detail": "From the beginner level of study words for school champions"
        },
        {
            "cat": "2",
            "name": "Champion Level 2",
            "description": "2025 School Spelling Bee Study List: 1st, 2nd and 3rd Grade Words",
            "detail": "From the intermediate level of study words for school champions"
        },
        {
            "cat": "3",
            "name": "Champion Level 3",
            "description": "2025 School Spelling Bee Study List: 1st, 2nd and 3rd Grade Words",
            "detail": "From the advanced level of study words for school champions"
        }
    ]
    html = '<div class="mt-2 p-3 bg-danger text-white rounded">' + 
            '<h1>Welcome to Bobcat Spelling!</h1>' + 
            '</div>'
    
    html += '<div class="row mt-5 justify-content-center">'

    bundles.forEach((entry) => {
            html += '<div class="col-md-4 mt-2 mb-2">' +
                    card(entry) +
                    '</div>'

        })
    html += '</div>'
    $("#main-menu").html(html)
    showTab("main-menu")
}

//-----------------------------------------------------------
const worker = new Worker('worker.js?13')
worker.onmessage = function(ev) {
    switch(ev.data.msg)
    {
        case "ready":
            mainMenu()
            break;
        case "installing":
            showTab("installing")
            break;
        case "data":
            sessionInit(ev.data.data)
            startQuiz(ev.data.data.cat)
            break;
        case "answer":
            loadQuestion(ev.data.data)
    }
};

//-----------------------------------------------------------
window.onload = function(e) {
    //check for 
    $('.nav-tabs a').on('shown.bs.tab', function(event) {
        if( $(event.target).text() === "MainMenu") {
            console.log("on main")
            $('a[name$="-resume"]').each((idx, elm) => {
                const cat = elm.name.substr(0, elm.name.length-7)
                $('a[name="'+ cat + '-resume' + '"]').addClass("invisible")
                if(doesSessionExist(cat)) {
                    $('a[name="'+ cat + '-resume' + '"]').removeClass("invisible")
                }
            })
        }
    });

    $("#answer").on("keydown", async function(event) {
        switch(event.keyCode)
        {
            case 13:
                event.preventDefault()
                if( $("#answer").val().toLowerCase() == local_targetWord )
                {
                    updateResult(true)
                    await setTimeout(()=>{ nextQuestion()}, 1500);
                }
                else {
                    updateResult(false)
                    await setTimeout(()=>{ resetAnswer()}, 600);
                }
                break;
            case 49:
                playAudio()
                event.preventDefault();
                break;
            case 57:
                reveal()
                event.preventDefault();
                break;
        }
    })

    worker.postMessage({
        "action":"install"
    })
}

//-----------------------------------------------------------
function loadQuestion(entry)
{
    local_targetWord = entry.word.toLowerCase()
    local_audio = new Audio(URL.createObjectURL(entry.mp3))

    $("#dfn").html(entry.dfn)
    $("#ex").html(entry.ex)
    $("#origin").html(entry.origin)
    playAudio()
}

//-----------------------------------------------------------
async function end()
{
    sessionClear(local_cat)
    explode()
    var audio = new Audio('./data/celebration_original.mp3');
    audio.play();
    await setTimeout(()=>{}, 3500);
}

//-----------------------------------------------------------
function updateProgress(value)
{
    $("#current-progress").css('width', value + '%')
                    .attr('aria-valuenow', value)
                    .html("<b>" + ((value > 100) ? "COMPLETED" : (local_index+1) + " / " + local_entries.length) + "</b>")
}

//-----------------------------------------------------------
function nextQuestion()
{
    sessionSetProgress(local_cat, local_index)
    bCompleted = (local_index === local_entries.length)
    updateProgress(((local_index+1)*100)/local_entries.length)
    if( bCompleted ) {
        end()
    }
    else {
        resetAnswer()
        worker.postMessage({
            "action": "play",
            "id": local_entries[local_index]
        })
        local_index = (local_index + 1)
    }
}

//-----------------------------------------------------------
function playAudio() {
    local_audio.play()
}

//-----------------------------------------------------------
function reveal()
{
    $("#answer").val(local_targetWord)
}

//-----------------------------------------------------------
function sessionInit(data)
{
    localStorage.setItem(data.cat+"-session", JSON.stringify(data.keys))
    localStorage.setItem(data.cat+"-progress", 0)
}

//-----------------------------------------------------------
function sessionClear(cat)
{
    localStorage.removeItem(cat+"-session")
    localStorage.removeItem(cat+"-progress")
}

//-----------------------------------------------------------
function sessionSetProgress(cat, idx)
{
    localStorage.setItem(cat +"-progress", idx)
}

//-----------------------------------------------------------
function doesSessionExist(cat)
{
    return (cat+"-session" in localStorage)
}

//-----------------------------------------------------------
function startQuiz(cat, restart=false)
{
    console.log(restart)
    if(!restart && doesSessionExist(cat))
    {
        local_index = parseInt(localStorage.getItem(cat+"-progress") || "0")
        local_entries = JSON.parse(localStorage.getItem(cat+"-session"))
        local_cat = cat
        showTab("quiz")
        nextQuestion()
    }
    else {
        worker.postMessage({
            "action":"query", 
            "cat": cat
        })
    }
}

//-----------------------------------------------------------
function showTab(tab_id)
{
    $(".nav-tabs a[href='#" + tab_id + "']").tab('show');
}

//-----------------------------------------------------------
function updateResult(isCorrect)
{
    $("#wrong").addClass("invisible")
    $("#correct").addClass("invisible")

    if( isCorrect ) {
        var audio = new Audio('./data/correct.mp3');
        audio.play();
        $("#correct").removeClass("invisible")
    }
    else {
        var audio = new Audio('./data/wrong.mp3');
        audio.play();
        $("#wrong").removeClass("invisible")
    }
}

//-----------------------------------------------------------
function resetAnswer()
{
    $("#answer").val("")
    $("#wrong").addClass("invisible")
    $("#correct").addClass("invisible")
}

//-----------------------------------------------------------
function explode()
{
    const count = 200,
    defaults = {
        origin: { y: 0.7 },
    };

    function fire(particleRatio, opts) {
    confetti(
        Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio),
        })
    );
    }

    fire(0.25, {
    spread: 26,
    startVelocity: 55,
    });

    fire(0.2, {
    spread: 60,
    });

    fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    });

    fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    });

    fire(0.1, {
    spread: 120,
    startVelocity: 45,
    });
}
