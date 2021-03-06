import * as qs from 'querystring'
namespace TSYLog {

    /**
 * 查询结果
 */
    export class SearchResult<T> {
        L: T[] = [];
        T: number = 0
        P: number = 1
        N: number = 10;
        R: { [index: string]: any } = {}
    }

    /**
     * 查询条件
     */
    export class SearchWhere {
        W: { [index: string]: any } = {}
        Keyword?: string = "";
        P?: number = 1;
        N?: number = 10;
        Sort?: string = "";
    }
    export class ClassEventLog {
        /**
         * 模块
         */
        Module: string = ""
        /**
         * 谁
         */
        Name: string = ""
        /**
         * 用户编号
         */
        UID: number = 0;
        /**
         * 地点
         */
        Addr: string = "";
        /**
         * GPS坐标存储
         */
        GPS: string = ""
        /**
         * IP地址
         */
        IP: string = "";
        /**
         * 设备
         */
        Device: string = "";
        /**
         * 干什么
         */
        What: string = "";
        /**
         * 什么时间
         */
        When: string = "";
        /**
         * 分组键
         */
        Key: string = "";
        /**
         * 应用编号
         */
        AID: number = 0;
        /**
         * 分组号
         */
        GID: number = 0;
        /**
         * 时间
         */
        Time: number = Date.now() / 1000;
        /**
         * 数据,JSON格式
         */
        Data: any = "";
        /**
         * 结论
         */
        Result: any = "";
        /**
         * 操作结论
         */
        Code: number = 200;

        Spend: number = 0;

        constructor(data?: ClassEventLog) {
            if (data) {
                for (let x in data) {
                    this[x] = data[x];
                }
            }
        }
    }

    export class EventLogDriver {

        async write(data: ClassEventLog[]) {
            throw new Error('未实现')
        }

        async read(data: SearchWhere): Promise<SearchResult<ClassEventLog>> {
            throw new Error('未实现')
        }

        async query(sql: string): Promise<any> {
            throw new Error('未实现')
        }

    }
    export class EventLog {

        log: EventLogDriver;

        constructor(driver: string = '', conf: any = {}) {
            if (driver) {
                if ('string' == typeof driver) {
                    this.log = require(driver).default(conf);
                } else {
                    console.log('use default log for console.log')
                }
            }
        }

        async write(data: ClassEventLog[]) {
            return await this.log.write(data);
        }

        async read(data: SearchWhere): Promise<SearchResult<ClassEventLog>> {
            return await this.log.read(data);
        }

        async query(sql: string): Promise<any> {
            return await this.log.query(sql);
        }

    }
    /**
     * 日志对象
     */
    export class ReqLog {
        /**
         * 模块名称
         */
        module: string = "";
        /**
         * 请求方法 GET|POST|..
         */
        method: string = "";
        /**
         * 请求路径
         */
        path: string = "";
        /**
         * 来源IP
         */
        from: string = "";
        /**
         * 服务端名称
         */
        server: string = "";
        /**
         * 请求开始时间
         */
        ctime: number = 0;
        /**
         * 请求结束时间
         */
        etime: number = 0;
        /**
         * 应用编号
         */
        appid: string = "";
        /**
         * 应用key
         */
        key: string = "";
        /**
         * 用户代理
         */
        agent: string = "";
        /**
         * 请求参数 JSON
         */
        req: string = "";
        /**
         * 响应数据 JSON
         */
        rep: string = "";
        /**
         * 请求长度
         */
        req_len: number = 0;
        /**
         * 响应长度
         */
        rep_len: number = 0;
        /**
         * 响应类型
         */
        rep_type: string = "";
        /**
         * 请求类型
         */
        req_type: string = "";
        /**
         * 响应代码
         */
        code: number = 200;
        /**
         * 请求rand值
         */
        rand: string = "";
        /**
         * 扩展数据
         */
        ext: string = "";
        /**
         * SQL记录
         */
        sqls: { SQL: string, Time: number }[] = [];
        /**
         * 消耗时间
         */
        time: number = 0;
        /**
         * 错误日志
         */
        err: any;
        constructor(ctx: any) {
            this.agent = ctx.get('user-agent');
            if (ctx.auth) {
                this.appid = ctx.auth.appid;
                this.key = ctx.auth.key;
                this.rand = ctx.auth.rand;
            }

            this.method = ctx.method;
            this.from = ctx.get('X-Real-IP') ||
                ctx.get('X-Forwarded-For') ||
                ctx.req.headers['x-forwarded-for'] ||
                ctx.req.connection.remoteAddress || // 判断 connection 的远程 IP
                ctx.req.socket.remoteAddress || // 判断后端的 socket 的 IP
                ctx.req.connection.socket.remoteAddress;

            if (ctx.route) {
                this.module = ctx.route
            }
            this.ctime = ctx.ctime;
            this.path = ctx.path;
            this.req_len = ctx.get('content-length');
            this.req_type = ctx.get('content-type');
            this.code = ctx.status;
        }

    }
    let sls = {
        put: (data: any) => {
            console.log(Object.keys(data).map((v: string) => {
                return v + ':' + 'object' == typeof data[v] ? JSON.stringify(data[v]) : ('number' == typeof data[v] ? data[v].toString() : (undefined === data[v] ? '' : data[v]))
            }).join(' '))
        }
    }
    /**
     * 中间件方法
     * @param ctx 
     * @param next 
     */
    async function mid(ctx, next) {
        ctx.ctime = Date.now();
        let err = false;
        try {
            await next()
        } catch (error) {
            err = error;
        } finally {
            let log = new ReqLog(ctx);
            log.etime = Date.now();
            log.time = log.etime - log.ctime;
            if (err || ctx.status >= 400 || ctx.query.debug == 'true') {
                log.req = ctx.request.body || {};
                log.err = err;
                log.rep = ctx.rbody || ctx.body;
            }
            sls.put(log);
        }
    }
    /**
     * Log的Use方法
     * @param driver 
     * @param conf 
     */
    export function use(driver: string | { put: (data: any) => void } = '', conf: { [index: string]: any } = {}): any {
        if (driver) {
            if ('string' == typeof driver) {
                sls = require(driver).default(conf);
            } else if (driver.put instanceof Function) {
                sls = driver;
            } else {
                console.log('use default log for console.log')
            }
        }
        return mid
    }
}

export default TSYLog;