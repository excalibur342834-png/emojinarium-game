// js/movies.js
export async function getRandomMovie() {
    // В реальном приложении здесь может быть API запрос к Кинопоиску
    const topMovies = [
        { title: "Побег из Шоушенка", year: "1994" },
        { title: "Крёстный отец", year: "1972" },
        { title: "Тёмный рыцарь", year: "2008" },
        { title: "Крёстный отец 2", year: "1974" },
        { title: "12 разгневанных мужчин", year: "1957" },
        { title: "Список Шиндлера", year: "1993" },
        { title: "Властелин колец: Возвращение короля", year: "2003" },
        { title: "Криминальное чтиво", year: "1994" },
        { title: "Властелин колец: Братство Кольца", year: "2001" },
        { title: "Хороший, плохой, злой", year: "1966" },
        { title: "Форрест Гамп", year: "1994" },
        { title: "Бойцовский клуб", year: "1999" },
        { title: "Властелин колец: Две крепости", year: "2002" },
        { title: "Начало", year: "2010" },
        { title: "Звёздные войны: Эпизод 5 - Империя наносит ответный удар", year: "1980" },
        { title: "Матрица", year: "1999" },
        { title: "Славные парни", year: "1990" },
        { title: "Пролетая над гнездом кукушки", year: "1975" },
        { title: "Семь", year: "1995" },
        { title: "Молчание ягнят", year: "1991" }
    ];

    const randomIndex = Math.floor(Math.random() * topMovies.length);
    return topMovies[randomIndex];
}

export function getFallbackMovies() {
    return [
        { title: "Титаник", year: "1997" },
        { title: "Король Лев", year: "1994" },
        { title: "Матрица", year: "1999" },
        { title: "Гарри Поттер и философский камень", year: "2001" },
        { title: "Пираты Карибского моря", year: "2003" },
        { title: "Властелин Колец", year: "2001" },
        { title: "Звездные Войны", year: "1977" },
        { title: "Холодное Сердце", year: "2013" },
        { title: "Человек-паук", year: "2002" },
        { title: "Аватар", year: "2009" }
    ];
}
