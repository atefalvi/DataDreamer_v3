# Site Map — v4 routes

Keep in sync with `03-INFORMATION-ARCHITECTURE.md` §1.

```mermaid
flowchart TD
    HOME["/ Home"] --> BLOG["/blog"]
    HOME --> PROJ["/projects"]
    HOME --> DT["/dream-team"]
    HOME --> ABOUT["/about"]
    HOME --> CONNECT["/connect"]
    HOME -. v4.1 .-> COURSES["/courses"]

    BLOG --> POST["/blog/[slug]"]
    BLOG --> TOPIC["/blog/topic/[slug]"]
    BLOG --> RSS["/rss.xml"]
    POST --> AUTHOR
    TOPIC --> POST

    PROJ --> CASE["/projects/[slug]"]

    DT --> AUTHOR["/dream-team/[slug]"]
    AUTHOR --> POST
    AUTHOR -. v4.1 .-> COURSE

    COURSES -. v4.1 .-> COURSE["/courses/[slug]"]
    COURSE -. v4.1 .-> LESSON["/courses/[slug]/[lesson]"]
    LESSON -. auth gate .-> LOGIN["/login"]
    COURSE -. enroll .-> SIGNUP["/signup"]
    LOGIN --> STUDENT["/student"]
    SIGNUP --> STUDENT
    STUDENT --> SETTINGS["/student/settings"]
    LOGIN --> FORGOT["/forgot-password"] --> RESET["/reset-password"]

    LEGACY["/logs/*  (301)"] ==> BLOG
    LEGACY ==> POST

    FOOTER["(footer)"] --> PRIVACY["/privacy"]
    ANY["unknown URL"] --> NF["/404"]
    ERR["server failure"] --> E500["/500"]
```
