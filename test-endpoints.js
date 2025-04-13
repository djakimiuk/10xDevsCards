import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";
const TEST_UUID = "123e4567-e89b-12d3-a456-426614174000";

async function getResponseData(response) {
  try {
    const clonedResponse = response.clone();
    return await clonedResponse.json();
  } catch (error) {
    return await response.text();
  }
}

async function runTest(testNumber, description, testFn) {
  console.log(`\nTest ${testNumber}: ${description}`);
  try {
    const response = await testFn();
    console.log(`Status: ${response.status}`);

    const data = await getResponseData(response);
    if (typeof data === "string") {
      console.log("Response (text):", data);
    } else {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(`Error in Test ${testNumber}:`, error.message);
  }
}

async function testEndpoints() {
  try {
    // Test 1: GET all candidates (should be empty list)
    await runTest(1, "GET all candidates", () => fetch(`${BASE_URL}/ai-candidates`));

    // Test 2: GET with invalid generation request ID
    await runTest(2, "GET with invalid generation request ID", () => fetch(`${BASE_URL}/ai-candidates/invalid-uuid`));

    // Test 3: PUT with invalid UUID format
    await runTest(3, "PUT with invalid UUID format", () =>
      fetch(`${BASE_URL}/ai-candidates/invalid-uuid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: "Test front",
          back: "Test back",
        }),
      })
    );

    // Test 4: PUT with valid UUID but non-existent record
    await runTest(4, "PUT with valid UUID but non-existent record", () =>
      fetch(`${BASE_URL}/ai-candidates/${TEST_UUID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: "Test front",
          back: "Test back",
        }),
      })
    );

    // Test 5: PUT with too long content
    await runTest(5, "PUT with too long content", () => {
      const longText = "A".repeat(201);
      return fetch(`${BASE_URL}/ai-candidates/${TEST_UUID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: longText,
          back: "Test back",
        }),
      });
    });

    // Test 6: DELETE with invalid UUID
    await runTest(6, "DELETE with invalid UUID", () =>
      fetch(`${BASE_URL}/ai-candidates/invalid-uuid`, {
        method: "DELETE",
      })
    );

    // Test 7: DELETE with valid UUID but non-existent record
    await runTest(7, "DELETE with valid UUID but non-existent record", () =>
      fetch(`${BASE_URL}/ai-candidates/${TEST_UUID}`, {
        method: "DELETE",
      })
    );

    // Test 8: POST /accept with invalid UUID
    await runTest(8, "POST /accept with invalid UUID", () =>
      fetch(`${BASE_URL}/ai-candidates/invalid-uuid/accept`, {
        method: "POST",
      })
    );

    // Test 9: POST /accept with valid UUID but non-existent record
    await runTest(9, "POST /accept with valid UUID but non-existent record", () =>
      fetch(`${BASE_URL}/ai-candidates/${TEST_UUID}/accept`, {
        method: "POST",
      })
    );
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

testEndpoints();
