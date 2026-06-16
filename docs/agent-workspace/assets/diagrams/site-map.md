# Site Map — v4 routes

Keep in sync with `03-INFORMATION-ARCHITECTURE.md` §1.

```mermaid
flowchart TD
    HOME["/ Home"] --> BLOG["/blog"]
    HOME --> PROJ["/projects"]
    HOME --> DT["/dream-team"]
    HOME --> ABOUT["/about"]
    HOME --> CONNECT["/connect"]
    HOME -. v4.1 .-> GUIDES["/guides"]

    BLOG --> POST["/blog/[slug]"]
    BLOG --> TOPIC["/blog/topic/[slug]"]
    BLOG --> RSS["/rss.xml"]
    POST --> AUTHOR
    TOPIC --> POST

    PROJ --> CASE["/projects/[slug]"]

    DT --> AUTHOR["/dream-team/[slug]"]
    AUTHOR --> POST
    AUTHOR -. v4.1 .-> GUIDE

    GUIDES -. v4.1 .-> GUIDE["/guides/[slug]"]
    GUIDE -. gated start .-> LOGIN["/login"]
    LOGIN --> SIGNUP["/signup"]
    LOGIN --> ACCOUNT["/account"]
    ACCOUNT -. resume .-> GUIDE
    %% Field Guide previews are public. Starting/reading item bodies and progress
    %% require login. No per-item route and no /student LMS dashboard.

    LEGACY["/logs/*  (301)"] ==> BLOG
    LEGACY ==> POST

    FOOTER["(footer)"] --> PRIVACY["/privacy"]
    ANY["unknown URL"] --> NF["/404"]
    ERR["server failure"] --> E500["/500"]
```
