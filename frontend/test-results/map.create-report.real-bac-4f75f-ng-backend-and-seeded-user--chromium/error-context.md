# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e8]:
    - link "PARTICIPIUM" [ref=e9] [cursor=pointer]:
      - /url: /
    - generic [ref=e10]:
      - link "Login" [ref=e11] [cursor=pointer]:
        - /url: /login
        - img [ref=e12]
        - text: Login
      - link "Sign Up" [ref=e14] [cursor=pointer]:
        - /url: /signup
        - img [ref=e15]
        - text: Sign Up
  - main [ref=e18]:
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Username
          - textbox "Insert username" [ref=e24]
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - textbox "Insert a password" [ref=e27]
      - alert [ref=e28]: Wrong username or password.
      - generic [ref=e29]:
        - button "Cancel" [ref=e31] [cursor=pointer]
        - button "Confirm" [ref=e33] [cursor=pointer]
```