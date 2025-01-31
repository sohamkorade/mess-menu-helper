const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    table = {}
let favorites = [],
    messes = {},
    date = new Date(),
    weekdayoffset = 1,
    selectedday = "",
    timemsg = "",
    ongoing = "",
    upcoming = "",
    timeslot = [],
    slots = [],
    selectedmess = "All",
    ratings = {}

fetch("data6.json").then(e => e.json()).then(data => {
    messes = data.messes
    weekdayoffset = data.weekdayoffset
    populatemesses()
    dateadd(0)
    populatedays()
    updateTimeleft(true)
    load_ratings().then(e => {
        updateDOM()
    })
})

if (localStorage.favorites) {
    favorites = localStorage.favorites.split("\n")
    generateexport()
}

if (localStorage.dismissedNewAlert) {
    document.getElementById('newalert').style.display='none'
}

function dismissNewAlert(element){
    element.parentElement.style.display='none'
    localStorage.setItem('dismissedNewAlert', 'true')
}

function clean(x) {
    return x.replace(/__\d+/, "")
}

function dateadd(add) {
    if (add)
        date.setDate(date.getDate() + add)
    else
        date = new Date()
    loadtable(date)
    updateDOM()
}

function dateset(newday) {
    date = new Date()
    for (let i = 0; i < 7 && date.toLocaleDateString('en-us', { weekday: 'long' }) != newday; i++)
        date.setDate(date.getDate() + 1)
    loadtable(date)
    updateDOM()
}

function setCheck(el) {
    localStorage[el.id] = el.checked ? 1 : 0
    updateDOM()
}

function loadtable(d) {
    const date = new Date(d)
    const weekday = date.getDay()
    selectedday = date.toLocaleDateString('en-us', { weekday: 'long' })

    for (let mess in messes) {
        table[mess] = {}
        const items = Object.entries(messes[mess].menu[(weekday - weekdayoffset + 7) % 7]).slice(1)
        let position = 0
        for (let section in messes[mess].sections) {
            if (!slots.includes(section))
                slots.push(section)
            table[mess][section] = items.slice(position, position += messes[mess].sections[section][0])
        }
    }
}

function hmin(time) {
    time = ((time % 24) + 24) % 24
    const h = Math.floor(time)
    const m = Math.round((time - h) * 60)
    return `${h ? `${h} h` : ""} ${m ? `${m} min` : ""}`
}

function updateTimeleft(repeat = false) {
    if (selectedmess == "All")
        selectedmess = Object.keys(messes)[0]
    timeslot = []
    const now = date//new Date()
    const currenthours = now.getHours() + now.getMinutes() / 60
    const sections = messes[selectedmess].sections
    let slotstart, slotend
    upcoming = ongoing = ""
    for (let section in sections) {
        slotstart = sections[section][1]
        slotend = sections[section][2]
        if (currenthours < slotstart) {
            timemsg = `${section} opening in ${hmin(sections[section][1] - currenthours)}`
            upcoming = section
            break
        } else if (currenthours <= slotend) {
            timemsg = `${section} closing in ${hmin(slotend - currenthours)}`
            ongoing = upcoming = section
            timeslot = [slotstart, slotend, currenthours]
            break
        }
    }
    if (upcoming == "") {
        let section = Object.keys(sections)[0]
        timemsg = `${section} opening in ${hmin(sections[section][1] - currenthours)}`
        upcoming = section
    }
    updateDOM()
    if (repeat) setTimeout(updateTimeleft, 60 * 1000, true)
}

function searchquery(query) {
    if (query.length < 3)
        updateDOM()
    else {
        let found = []
        const querywords = query.trim().split(" ")
        for (let mess in messes)
            for (let weekday in messes[mess].menu)
                for (let slot in messes[mess].menu[weekday])
                    if (querywords.every(word => messes[mess].menu[weekday][slot].match(new RegExp(word, "i"))))
                        found.push([mess, week[(+weekday + weekdayoffset + 7) % 7], messes[mess].menu[weekday][slot]].join(" > "))
        populatesearchresults(found, query, querywords)
    }
}


function todaysfavorites() {
    let todaysslots = {}
    for (let slot of slots)
        todaysslots[slot] = []

    for (let item of favorites) {
        const [today, todaysmess, todaysslot] = item.split(" > ")
        if (today == selectedday)
            todaysslots[todaysslot].push(todaysmess)
    }
    populatemeals(todaysslots)
}

function rate(el, rating) {
    const slot_item = document.getElementById('ratingslot').innerText + " > " + document.getElementById('ratingitem').innerText
    console.log(slot_item, rating)
    const stars = el.parentElement.children
    let i
    for (i = 0; i < rating; i++) {
        stars[i].classList.remove("text-secondary")
        stars[i].classList.add("text-warning")
    }
    for (; i < stars.length; i++) {
        stars[i].classList.remove("text-warning")
        stars[i].classList.add("text-secondary")
    }

    // send rating to server
    const post_url = `post_rating.php?` + new URLSearchParams({ food_name: slot_item, stars: rating })
    console.log(slot_item, post_url)
    fetch(post_url).then(e => e.text()).then(e => {
        document.getElementById('ratingthanks').innerText = "Thank you for your feedback!"
        load_ratings().then(e => {
            updateDOM()
        })
    }).catch(e => {
        document.getElementById('ratingthanks').innerText = "Failed to send feedback. Please try again later."
    })
}

function reset_rating_modal() {
    const stars = document.getElementById('ratingstars').children
    for (let i = 0; i < stars.length; i++) {
        stars[i].classList.remove("text-warning")
        stars[i].classList.add("text-secondary")
    }
    document.getElementById('ratingthanks').innerText = ""
}

async function load_ratings() {
    // clear ratings
    ratings = {}
    await fetch("ratings.txt").then(e => e.text())
        .then(e => {
            const rows = e.split("\n")
            for (let row of rows) {
                const [slot_item, rating, users] = row.split("\t")
                // hacky
                if (slot_item[0] == '"' && slot_item[slot_item.length - 1] == '"')
                    ratings[slot_item.slice(1, -1)] = { rating, users }
                else
                    ratings[slot_item] = { rating, users }
            }
        })
}