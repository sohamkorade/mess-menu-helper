function $(x) { return document.getElementById(x) }

const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    messes = {},
    table = {},
    slots = []
let favorites = [],
    date = new Date(),
    weekdayoffset = 1,
    day = "",
    timemsg = "",
    ongoing = "",
    upcoming = "",
    timeslot = [],
    selectedmess = "All"


fetch("data.json").then(e => e.json()).then(data => {
    Object.assign(messes, data.messes)
    weekdayoffset = data.weekdayoffset
    let html = `<input class="column button-outline" type="button" value="All" onclick="updateDOM('All')">`
    for (let mess in messes)
        html += `<input class="column button-outline" type="button" value="${mess}" onclick="updateDOM('${mess}')">`
    $("messes").innerHTML = html

    updateTimeleft()
    dateadd(0)
    html = ""
    for (let weekday of week)
        html += `<input class="column button-outline ${weekday == day ? "button-clear" : ""}" type="button" value="${weekday.slice(0, 3)}" data-day="${weekday}" onclick="dateset('${weekday}')">`
    $("days").innerHTML = html
})



if (localStorage.favorites) {
    favorites = localStorage.favorites.split("\n")
    generateexport()
}
$("showblankcategories").checked = +localStorage.showblankcategories ? 1 : 0
$("showcategories").checked = +localStorage.showcategories ? 1 : 0
$("showonlyfavorites").checked = +localStorage.showonlyfavorites ? 1 : 0

setInterval(updateTimeleft, 60 * 1000)

//=======================
//functions




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
    while (date.toLocaleDateString('en-us', { weekday: 'long' }) != newday)
        date.setDate(date.getDate() + 1)
    loadtable(date)
    updateDOM()
}

function setCheck(el) {
    localStorage[el.id] = el.checked ? 1 : 0
    updateDOM()
}

function importfav(el) {
    console.log(el.files)
    const reader = new FileReader()
    reader.onload = () => {
        const match = reader.result.match(/([^>]+ > [^>]+ > [^>]+\n)*([^>]+ > [^>]+ > [^>]+\n?)/)[0]
        if (match)
            console.log(reader.result == match)
    }
    if (el.files.length) reader.readAsText(el.files[0])
}

function loadtable(d) {
    const date = new Date(d)
    const weekday = date.getDay()
    day = date.toLocaleDateString('en-us', { weekday: 'long' })

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

function updateTimeleft() {
    if (selectedmess == "All")
        selectedmess = Object.keys(messes)[0]
    timeslot = []
    const currenthours = date.getHours() + date.getMinutes() / 60
    const sections = messes[selectedmess].sections
    let slotstart, slotend
    upcoming = ongoing = ""
    for (let section in sections) {
        slotstart = sections[section][1]
        slotend = sections[section][2]
        if (currenthours < slotstart) {
            timemsg = `${section} in ${hmin(slotstart - currenthours)}`
            upcoming = section
            break
        }
        else if (currenthours <= slotend) {
            timemsg = `Mess open for ${section}, closing in ${hmin(slotend - currenthours)}`
            ongoing = upcoming = section
            timeslot = [slotstart, slotend, currenthours]
            break
        }
    }
    if (upcoming == "") {
        let section = Object.keys(sections)[0]
        timemsg = `${section} in ${hmin(sections[section][1] - currenthours)}`
        upcoming = section
    }
    updateDOM()
}


//==================================================================
//UI

function generateexport() {
    $("export").href = `data:text/plain;charset=utf-8,${encodeURIComponent(localStorage.favorites)}`
}

function goto(el) {
    const [newmess, newday, newitem] = el.innerText.split(" > ")
    dateset(newday)
    updateDOM(newmess, newitem)
}

function search(query) {
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
        let html = `<h2>${found.length} results found for '${query}'</h2>`
        for (let item of found)
            html += `<li><a href="#" onclick="goto(this)">${item.replace(new RegExp(querywords.join("|"), "ig"), `<mark>$&</mark>`)}</a></li>`

        $("table").innerHTML = found.length ?
            `<ul>${html}</ul>` : `<h2>'${query}' not found in menu :(</h2>`
    }
}

function heart(icon, slot, add = true) {
    if (add) {
        if (!favorites.includes(slot))
            favorites.push(slot)
        icon.className = "fa-solid fa-heart"
        icon.outerHTML = `<i class="fa-solid fa-heart" onclick="heart(this,'${slot}',0)"></i>`
    } else {
        favorites = favorites.filter(v => v != slot)
        icon.className = "fa-regular fa-heart"
        icon.outerHTML = `<i class="fa-regular fa-heart" onclick="heart(this,'${slot}')"></i>`
    }
    localStorage.favorites = favorites.join("\n")
    generateexport()
}

function updateDOM(specific = null, mark = null) {
    selectedmess = specific || localStorage.selected || "All"
    localStorage.selected = selectedmess

    $("msg").innerHTML = timemsg
    if (timeslot.length) {
        $("progress").classList.remove("hide")
        $("progress").value = (timeslot[2] - timeslot[0]) / (timeslot[1] - timeslot[0])
    } else {
        $("progress").classList.add("hide")
    }

    for (let weekday of $("days").children)
        if (weekday.getAttribute("data-day") == day)
            weekday.classList.remove("button-outline")
        else
            weekday.classList.add("button-outline")


    for (let messbutton of $("messes").children)
        if (messbutton.value == selectedmess)
            messbutton.classList.remove("button-outline")
        else
            messbutton.classList.add("button-outline")

    let html = "",
        completed = true

    let itemcount
    for (let mess in table)
        if (selectedmess == "All" || mess == selectedmess) {
            html += "<tr>"
            if (selectedmess == "All")
                html += `<th><h3>${mess}</h3></th>`
            for (let c of slots) {
                itemcount = 0
                let tablehtml = `<table class="box">`
                if (c == upcoming) {
                    completed = false
                    tablehtml += `<th class="upcoming">${c} `
                    tablehtml += c == ongoing ? `<i class="fa-solid fa-lock-open"></i>` : `<i class="fa-solid fa-lock"></i>`
                }
                else {
                    tablehtml += `<th>${c}`
                    if (completed)
                        tablehtml += ` <i class="fa-solid fa-check-double"></i>`
                }
                tablehtml += `</th>`

                if (!+localStorage.showonlyfavorites || favorites.includes(`${mess} > ${c}`)) {
                    const slot = `${day} > ${mess} > ${c}`
                    if (favorites.includes(slot))
                        tablehtml += `<i class="fa-solid fa-heart" onclick="heart(this,'${slot}',0)"></i>`
                    else
                        tablehtml += `<i class="fa-regular fa-heart" onclick="heart(this,'${slot}')"></i>`
                    for (let item of table[mess][c]) {
                        tablehtml += "<tr>"
                        if (item[1]) {
                            if (+localStorage.showcategories)
                                tablehtml += `<th>${clean(item[0])}</th>`
                            let itemname = item[1]
                            if (mark)
                                itemname = itemname.replace(new RegExp(mark, "ig"), `<mark>$&</mark>`)
                            tablehtml += `<td>${itemname}</td>`
                            itemcount++
                        } else if (+localStorage.showblankcategories) {
                            tablehtml += `<td><strike>${clean(item[0])}</strike></td>`
                            itemcount++
                        }
                        tablehtml += "</tr>"
                    }
                    tablehtml += "</table>"
                }
                if (itemcount) {
                    html += c == upcoming ? `<td class="upcoming">` : `<td>`
                    html += tablehtml + "</td>"
                } else
                    html += "<td></td>"

            }
            html += `</tr>`
        }
    if (html == "<tr><td></td><td></td><td></td><td></td></tr>")
        html += `<h2>No favorites in '${selectedmess}' :(</h2>`
    $("table").innerHTML = `<tbody class="slots">${html}</tbody>`
}