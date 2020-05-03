import * as qs from 'querystring'
namespace TSYLog {
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
            this.from = ctx.get('X-Real-IP') || ctx.get('X-Forwarded-For')
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