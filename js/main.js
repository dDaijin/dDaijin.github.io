document.getElementById("loadData").addEventListener("click", function() {
    fetch("media.php")
        .then(response => response.json())
        .then(data => {
            document.getElementById("result").innerHTML = `
                <p><strong>Сообщение:</strong> ${data.message}</p>
                <p><strong>Время сервера:</strong> ${data.time}</p>
            `;
        })
        .catch(error => console.error("Ошибка:", error));
});
