function $(x) { return document.getElementById(x) }
$("showblankcategories").checked = +localStorage.showblankcategories ? 1 : 0
$("showcategories").checked = +localStorage.showcategories ? 1 : 0

function loadpic(slotstring) {
    $("uploadpic").setAttribute("onclick", `uploadpic("${slotstring}")`)
    $("imagedetails").innerHTML = `Make sure you upload for <h5>${slotstring}</h5>`
    fetch(`uploads/${slotstring}`).then(e => {
        if (e.ok)
            return e.text()
        else
            throw new Error()
    }).then(e => {
        $("image").src = e
    }).catch(e => { $("image").src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/195px-No-Image-Placeholder.svg.png" }
    )
}

function chosenpic() {
    const file = document.getElementById("file").files[0]
    if (!file) return
    $("image").src = URL.createObjectURL(file)
}

function uploadpic(slotstring) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = 500, canvas.height = 300
    ctx.drawImage($("image"), 0, 0, 500, 300)
    const data = canvas.toDataURL()
    try {
        $("uploadpicinfo").innerHTML += `<div id="uploadingpic" class="alert alert-primary alert-dismissible fade show">
                Uploading for ${slotstring}
                <div class="progress"><div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div></div>
                <button class="close" data-dismiss="alert">&times;</button>
                </div>`
        jQuery.ajax({
            type: "POST",
            url: "save.php",
            data: { content: data, filename: slotstring, mode: "pic" },
            success: msg => {
                $("uploadingpic").remove()
                $("uploadpicinfo").innerHTML += `<div class="alert alert-success alert-dismissible fade show">
                <strong>Uploaded!</strong> Thank you for contributing :-)
                <button class="close" data-dismiss="alert">&times;</button>
                </div>`
            }
        })
    } catch (e) {
        $("uploadpicinfo").innerHTML += `<div class="alert alert-danger alert-dismissible fade show">
            <strong>Error occured!</strong> Please try again.
            <button class="close" data-dismiss="alert">&times;</button>
            </div>`
    }
}

function uploaddata(content, filename, mode) {
    jQuery.ajax({
        type: "POST",
        url: "save.php",
        data: { content, filename, mode }
    })
}

function generateexport() {
    $("export").href = window.URL.createObjectURL(new Blob([localStorage.favorites], { type: 'text/plain' }))
    $("whatsapp").href = `https://wa.me?text=${encodeURIComponent(localStorage.favorites)}`
    $("sharewhatsapp").href = `https://wa.me?text=${encodeURIComponent("See IIITH mess menu easily with this site: https://sohamapps.rf.gd/mess/")}`
}

function goto(el) {
    const [newmess, newday, newitem] = el.innerText.split(" > ")
    dateset(newday)
    updateDOM(newmess, newitem)
}

function heart(icon, slot, add = true) {
    if (add) {
        if (!favorites.includes(slot))
            favorites.push(slot)
    }
    else
        favorites = favorites.filter(v => v != slot)
    localStorage.favorites = favorites.join("\n")
    generateexport()
    updateDOM()
}

function updateDOM(specific = null, mark = null) {
    selectedmess = specific || localStorage.selected || "All"
    localStorage.selected = selectedmess

    todaysfavorites()
    updatebuttonactivestates()

    let html = ""

    let itemcount
    for (let mess in table)
        if (selectedmess == "All" || mess == selectedmess) {
            html += "<tr>"
            if (selectedmess == "All")
                html += `<th><h3>${mess}</h3></th>`
            for (let slot of slots) {
                itemcount = 0
                const slotstring = `${selectedday} > ${mess} > ${slot}`
                let tablehtml = `<table class="mx-2 mb-2">`
                if (favorites.includes(slotstring))
                    tablehtml += `<i data-toggle="button" class="col border-0 btn btn-outline-danger fa fa-heart active" onclick="heart(this,'${slotstring}',0)"></i>`
                else
                    tablehtml += `<i data-toggle="button" class="col border-0 btn btn-outline-danger fa fa-heart" onclick="heart(this,'${slotstring}')"></i>`
                // tablehtml += `<i data-toggle="modal" data-target="#picview" class="col border-0 btn btn-outline-primary fa fa-image" onclick="loadpic('${slotstring}')"></i></tr>`
                tablehtml += `<th>${slot}</th>`


                for (let item of table[mess][slot]) {
                    tablehtml += "<tr>"
                    if (item[1]) {
                        if (+localStorage.showcategories)
                            tablehtml += `<th>${clean(item[0])}</th>`
                        const itemname = item[1].replaceAll("\n", "<br>")
                        let itemrow = itemname
                        if (mark)
                            itemrow = itemrow.replace(new RegExp(mark, "ig"), `<mark>$&</mark>`)
                        itemrow = itemrow.replace(new RegExp("(.*)\\*$", "gm"), `$1 <button class="btn btn-sm btn-success" disabled>New</button>`)
                        itemrow = itemrow.replaceAll("\n", "<br>")
                        // on click open rating modal
                        itemlink = `<a href="#" data-toggle="modal" data-target="#rating"
                        onclick="document.getElementById('ratingslot').innerText='${slotstring} > ${clean(item[0])}';document.getElementById('ratingitem').innerText='${itemname}'"
                        >${itemrow}</a>`
                        const slot_item = `${slotstring} > ${clean(item[0])} > ${itemname}`
                        // print if rating exists for this item
                        if (ratings[slot_item]) {
                            const rating = ratings[slot_item].rating
                            const users = ratings[slot_item].users
                            let badge_color = "bg-secondary"
                            if (rating <= 2.5)
                                badge_color = "bg-danger"
                            else if (rating <= 3.5)
                                badge_color = "bg-warning"
                            else if (rating <= 4.5)
                                badge_color = "bg-info"
                            else if (rating <= 5)
                                badge_color = "bg-success"
                            tablehtml += `<td>${itemlink} <span class="badge rounded-pill ${badge_color}">${Math.round(rating, 1)} <i class="fa fa-star"></i> (${users})</span></td>`
                        } else {
                            tablehtml += `<td>${itemlink}</td>`
                        }
                        itemcount++
                    } else if (+localStorage.showblankcategories) {
                        tablehtml += `<td><strike>${clean(item[0])}</strike></td>`
                        itemcount++
                    }
                    tablehtml += "</tr>"
                }
                tablehtml += "</table>"
                // tablehtml += `<div class="rating text-center" data-rating="${slotstring}">`
                // for (let i = 1; i <= 5; i++)
                //     tablehtml += `<i class="fa fa-star text-secondary" onclick="rate(this,${i})"></i>`
                // tablehtml += `</div>`
                if (itemcount) {
                    html += `<td class="${slot == upcoming ? "table-primary" : ""} ${favorites.includes(slotstring) ? "table-danger" : ""}">`
                    html += tablehtml + "</td>"
                } else
                    html += "<td></td>"
            }
            html += `</tr>`
        }
    if (html == "<tr><td></td><td></td><td></td><td></td></tr>")
        html = `<h2>No favorites in '${selectedmess}' :-(</h2>`
    else
        html = `<tbody class="slots">${html}</tbody>`
    $("table").innerHTML = html
}

function showfavorites() {
    let html = ""
    for (let item of favorites) {
        const parts = item.split(" > ")
        html += `<li><a href="#" onclick="goto(this)">${[parts[1], parts[0], parts[2]].join(" > ")}</a></li>`
    }
    $("favoriteslist").innerHTML = html ? html : `<div class="alert alert-info">Click on <i class="fa-regular fa-heart"></i> to favorite an item.</div>`
    uploaddata(favorites.join("\n"), "anon", "fav")
    // if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => { uploaddata(JSON.stringify(p), "anon", "location") }, e => { }, { enableHighAccuracy: true })
}

function populatemesses() {
    let html = `<li class="page-item"><a class="page-link" href="#" onclick="updateDOM('All')">All</a></li>`
    for (let mess in messes)
        html += `<li class="page-item"><a class="page-link" href="#" onclick="updateDOM('${mess}')">${mess}</a></li>`
    $("messes").innerHTML = html
}

function populatedays() {
    let html = ""
    for (let weekday of week)
        html += `<li class="page-item"><a class="page-link ${weekday.slice(0, 3) == selectedday.slice(0, 3) ? "rounded-circle" : ""}" href="#" onclick="dateset('${weekday}')" data-day="${weekday}">${weekday.slice(0, 3)}</a></li>`
    $("days").innerHTML = html
}

function populatesearchresults(found, query, querywords) {
    let html = ""
    for (let item of found)
        html += `<li><a href="#" onclick="goto(this)">${item.replace(new RegExp(querywords.join("|"), "ig"), `<mark>$&</mark>`)}</a></li>`

    $("table").innerHTML = found.length ?
        `<h2>${found.length} results found for '${query}'</h2><ul>${html}</ul>` : `<h2>'${query}' not found in menu :(</h2>`
}

function populatemeals(todaysslots) {
    let html = "", completed = true
    for (let slot in todaysslots) {
        let info = ""
        if (slot == upcoming) {
            completed = false
            if (slot == ongoing)
                info = `<i class="fa fa-lock-open text-success"></i>`
            else
                info = `<i class="fa fa-lock text-success"></i>`
        }
        else
            if (completed)
                info = `<i class="fa fa-check-double text-info"></i>`
        html += `<tr class="${slot == upcoming ? "table-primary" : ""}"><th>${slot}</th><td>${todaysslots[slot]} ${info}</td></tr>`
    }
    let msghtml = `<h2>${timemsg}</h2>`
    if (ongoing) msghtml += `<div class="progress"><div style="width:${(timeslot[2] - timeslot[0]) / (timeslot[1] - timeslot[0]) * 100}%;" id="progress" class="progress-bar progress-bar-striped progress-bar-animated"></div></div>`
    $("msg").innerHTML = msghtml
    let displayday = ""
    if (new Date().toLocaleDateString('en-us', { weekday: 'long' }) == selectedday)
        displayday = "Today"
    else
        displayday = selectedday
    $("meals").innerHTML = `<h5>${displayday}'s favorites</h5>
    <table id="meals" class="table table-bordered"><tbody>${html}</tbody></table>`
    populatewef()
}

function updatebuttonactivestates() {
    for (let weekday of $("days").children)
        if (weekday.children[0].getAttribute("data-day") == selectedday)
            weekday.classList.add("active")
        else
            weekday.classList.remove("active")
    for (let messbutton of $("messes").children)
        if (messbutton.children[0].innerText == selectedmess)
            messbutton.classList.add("active")
        else
            messbutton.classList.remove("active")
}

function populatewef() {
    let html = ""
    for (let mess in messes)
        if (mess == selectedmess)
            html += `<h5 class="text-success">Last updated on ${messes[mess].wef}</h5>`
    $("wef").innerHTML = html
}