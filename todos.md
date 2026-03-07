# Todos

- [x] Investigate inline selection change event, seems to not be throttled. (Must) (Fixed)
- [x] Potentially make cursor animation be enabled only once the user stops typing for a short period. (Nice to have)
- [x] Optimize event debouncing/throttling for high-frequency changes
- [x] Fix users writting on the same line causing cursor jumping. (Must)
- [x] Show inline selection of remote users in the collaborative editor. (Must)
- [x] Fix cursor is positioned correctly, even if the container size is different. (Must)
- [ ] Internal feature to temporary block ui cursors and selection changes while the container is being resized. Or some other solution (Must, Dependent on above)
- [x] Add user presence and idle status. (Nice to have)
- [x] Add option to disable showing remote cursors and selections.(Achievable using css styles) (Nice to have)
- [ ] Add heartbeat/keep-alive mechanism
- [ ] Add positibility to handle display of other blocks state (e.g. pending deletions on tables, or other custom states). (Research) (Nice to have)
- [ ] Add posibility to attach other elements to cursors (e.g. user name tags, or other custom elements). (Research) (Nice to have)
- [x] ~~Add option to do a sync on network/socket reconnect (as an interface function). (Nice to have, Useful)~~ Users should manually sync the state as all the data is externally available and settable, and the library should not make assumptions about the data management strategy of the user. (Decided)
- [ ] Possibly add user list display with colors and names. (Nice to have)
- [ ] Implement conflict resolution strategy for simultaneous edits at same position
