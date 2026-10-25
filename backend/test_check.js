const fetch = globalThis.fetch;
async function test() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/users");
    console.log("Response status:", res.status, res.statusText);
    const text = await res.text();
    console.log("Response body:", text.slice(0, 300));
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
test();
