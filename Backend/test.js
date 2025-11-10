require("dotenv").config();
const fetch = require("node-fetch");

const fetchData = async () => {
  try {
    // let page = 1;
    // let hasNextPage = true;

    // while (hasNextPage) {
    const response = await fetch(
      // `https://student.tdtutf.uz/rest/v1/data/student-list?limit=200&search=xamroyeva`,
      `https://student.tdtutf.uz/rest/v1/data/student-list?_group=385`,
      {
        headers: {
          Authorization: process.env.Authorization,
          accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Serverdan noto'g'ri javob keldi: " + response.status);
    }

    const data = await response.json();
    data.data.items.forEach((item) => {
      console.log(item.full_name);
    });

    // hasNextPage = data.data.next_page !== null;
    // page++;
    // }
  } catch (error) {
    console.error("Xato yuz berdi:", error);
  }
};

fetchData();
