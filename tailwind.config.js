@import "tailwindcss";

:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color-scheme: dark;
  background: #020617;
  color: #f8fafc;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  min-height: 100%;
  background: #020617;
}

body {
  min-height: 100vh;
  overflow-x: hidden;
  background: linear-gradient(to bottom, #020617, #0f172a);
  color: #f8fafc;
}

button {
  cursor: pointer;
  transition: all 0.25s ease;
}

input,
select,
textarea {
  outline: none;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #f59e0b;
  border-radius: 999px;
}

::-webkit-scrollbar-track {
  background: #0f172a;
}

::selection {
  background: #f59e0b;
  color: #020617;
}
