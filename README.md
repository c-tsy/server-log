```typescript
server.use(TSYLog.use('@ctsy/server-log-sls', {
    "accessKeyId": "",
    "secretAccessKey": "",
    projectName: '',
    logStoreName: '',
    topic: 'reqlog',
}))
```