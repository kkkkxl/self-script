/**
 作者：临渊
 日期：6-29
 软件：和家亲 （入口：首页 ->签到领红包）
 功能：签到、做任务和自动提现
 抓包：开着抓包软件进活动，抓 https://point.jrongjie.com/web/auth/app/login 这条链接里?后面的东西全要
 示例：appId=xxx&uid=xxx&secret=xxx
 变量格式：export hjq='xxx@xxx'  多个账号用 @ 或者 换行 分割
 定时：一天一次
 cron：30 10 * * *

 如果要自动提现请填写变量 hjqTX 示例：export hjqTX='支付宝手机号1&真实姓名1@支付宝手机号2&真实姓名2'
 支付宝手机号要和注册账号一样

 [task_local]
 #和家亲
 30 10 * * * https://raw.githubusercontent.com/LinYuanovo/scripts/main/hjq.js, tag=和家亲, enabled=false
 [rewrite_local]
 https://point.jrongjie.com/web/auth/app/login url script-request-header https://raw.githubusercontent.com/LinYuanovo/scripts/main/hjq.js
 [MITM]
 hostname = point.jrongjie.com
 */

 const $ = new Env('和家亲');
 const notify = $.isNode() ? require('./sendNotify') : '';
 const {log} = console;
 const Notify = 1; //0为关闭通知，1为打开通知,默认为1
 const debug = 0; //0为关闭调试，1为打开调试,默认为0
 const uaNum = 1; //随机UA，从0-20随便选一个填上去
 const autoWithdraw = 1; //0为关闭自动提现，1为打开自动提现,默认为1
 //////////////////////
 let scriptVersion = "1.0.7";
 let scriptVersionLatest = '';
 let hjq = ($.isNode() ? process.env.hjq : $.getdata("hjq")) || "";
 let hjqArr = [];
 let hjqAU = '';
 let UA = ($.isNode() ? process.env.UA : $.getdata("UA")) || "";
 let UAArr = [];
 let hjqTX = ($.isNode() ? process.env.hjqTX : $.getdata("hjqTX")) || "";
 let hjqTXArr = [];
 let tx = '';
 let txBack = 0;
 let txIdArr = ["140","318","139","107","319","320"];//0.1 0.2 0.5 1 5 10
 let txNum = 0;
 let msg = '';
 let ck = '';
 let integral = 0;
 const User_Agents = [
    "Mozilla/5.0 (Linux; Android 10; ONEPLUS A5010 Build/QKQ1.191014.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Linux; Android 9; Mi Note 3 Build/PKQ1.181007.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/045131 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; GM1910 Build/QKQ1.190716.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 9; 16T Build/PKQ1.190616.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/532.0 (KHTML, like Gecko) CriOS/43.0.823.0 Mobile/65M532 Safari/532.0",
    "Mozilla/5.0 (iPod; U; CPU iPhone OS 3_1 like Mac OS X; rw-RW) AppleWebKit/531.9.3 (KHTML, like Gecko) Version/4.0.5 Mobile/8B118 Safari/6531.9.3",
    "Mozilla/5.0 (Linux; Android 9; MI 6 Build/PKQ1.190118.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; Redmi K30 5G Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045511 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; ONEPLUS A6000 Build/QKQ1.190716.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045224 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 9; MHA-AL00 Build/HUAWEIMHA-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 8.0.0; HTC U-3w Build/OPR6.170623.013; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; LYA-AL00 Build/HUAWEILYA-AL00L; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 8.1.0; MI 8 Build/OPM1.171019.026; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/045131 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; Redmi K20 Pro Premium Edition Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 8.1.0; 16 X Build/OPM1.171019.026; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; M2006J10C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/532.0 (KHTML, like Gecko) FxiOS/18.2n0520.0 Mobile/50C216 Safari/532.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
 ]
 let ua = User_Agents[uaNum];
 let taskIdArr = [];
 let subTaskIdArr = [];
 let subTaskNumArr = [];
 let subTaskNum = 0;
 let subTaskBack = 0;
 let loginBack = 0;

 !(async () => {

     if (typeof $request !== "undefined") {
         await GetRewrite();
     } else {
         if (!(await Envs()))
             return;
         else {

             log(`\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
                 new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
                 8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);

             await poem();
             await getVersion();
             log(`\n============ 当前版本：${scriptVersion}，最新版本：${scriptVersionLatest} ============`)
             log(`\n=================== 共找到 ${hjqArr.length} 个账号 ===================`)

             if (debug) {
                 log(`【debug】 这是你的全部账号数组:\n ${hjqArr}`);
             }


             for (let index = 0; index < hjqArr.length; index++) {

                 ua = User_Agents[uaNum+index];

                 if (UA) {
                     if (index >= UAArr.length){
                         let i = UAArr.length+randomInt(0,2)
                         ua = User_Agents[uaNum+i];
                     } else ua = UAArr[index];
                 }

                 let num = index + 1
                 log(`\n========= 开始【第 ${num} 个账号】=========\n`)

                 hjq = hjqArr[index];
                 if (hjqTXArr.length >= 1) {
                     tx = hjqTXArr[index].split("&");
                     if (tx) {
                         txBack = 1;
                     } else txBack = 0;
                 }

                 if (debug) {
                     log(`\n 【debug】 这是你第 ${num} 账号信息:\n ${data}\n`);
                 }

                 msg += `\n第${num}个账号运行结果：`

                 await $.wait(randomInt(5000,10000));

                 log('【开始登录】');
                 await login();
                 await $.wait(2 * 1000);

                 if (loginBack) {

                     log('【开始获取任务列表】');
                     await getTaskList();
                     await $.wait(2 * 1000);

                     log('【开始普通签到】');
                     await doSign();
                     await $.wait(2 * 1000);
                     //领取普通签到
                     await getSignReward();
                     await $.wait(2 * 1000);

                     log('【开始翻倍签到】');
                     await doDoubleSign();
                     await $.wait(2 * 1000);
                     //领取翻倍签到
                     await getDoubleSignReward();
                     await $.wait(2 * 1000);

                     log('【开始执行任务】')
                     for (let i = 0; i < subTaskNum; i++) {
                         subTaskBack = 0;

                         log(`[开始提交第${i+1}个任务]`);
                         await subTask(i);
                         await $.wait(randomInt(3000,6000));

                         if (subTaskBack) {
                             log(`[开始领取第${i+1}个任务奖励]`);
                             await getTaskReward(i);
                             await $.wait(randomInt(3000,6000));
                         }
                     }
                     subTaskNum = 0;

                     log('【开始查询信息】');
                     await getInfo();
                     await $.wait(2 * 1000);

                     log(`账号[${num}]金币余额为：${integral}`)
                     msg += `\n账号[${num}]金币余额为：${integral}`

                     await $.wait(randomInt(5000,10000));
                 }

             }
             await SendMsg(msg);
         }
     }
 
 })()
     .catch((e) => log(e))
     .finally(() => $.done())

/**
 * 登录
 */
function login() {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/auth/app/login?${hjq}`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 登录 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 登录 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    log(`获取Token成功`)
                    hjqAU = "Bearer " + result.data.token;
                    loginBack = 1;
                } else if (result.code == -1) {
                    log(`获取Token失败，退出`)
                } else {
                    log(`获取Token失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 获取任务列表
 */
function getTaskList(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/task/getTask`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 获取任务列表 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 获取任务列表 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {

                    log(`获取任务列表成功`)
                    for (let i = 0; i < result.data.length; i++) {
                        if (result.data[i].hasOwnProperty("task_list")) {
                            for (let j = 0; j < result.data[i].task_list.length; j++) {
                                taskIdArr[subTaskNum] = result.data[i].task_id;
                                subTaskIdArr[subTaskNum] = result.data[i].task_list[j].subtasks_id;
                                subTaskNumArr[subTaskNum] = result.data[i].task_list[j].completeNum;
                                subTaskNum++;
                            }
                        }
                    }

                } else {

                    log(`获取任务列表失败，原因是：${result.msg}`)

                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 提交任务
 */
function subTask(num) {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/task/setTask?taskId=${taskIdArr[num]}&subtasks_id=${subTaskIdArr[num]}&num=${subTaskNumArr[num]}`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 提交任务 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 提交任务 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    log(`提交第${num+1}个任务成功`)
                    subTaskBack = 1;
                } else if (result.code == -1) {
                    log(`提交第${num+1}个任务失败，已提交过`)
                } else {
                    log(`提交第${num+1}个任务失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 领取任务奖励
 */
function getTaskReward(num) {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/task/getRewards?taskId=${taskIdArr[num]}&subtasks_id=${subTaskIdArr[num]}`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 领取任务奖励 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 领取任务奖励 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    log(`领取第${num+1}个任务奖励成功`)
                } else if (result.code == -1) {
                    log(`领取第${num+1}个任务奖励失败，已领取过`)
                } else {
                    log(`提交第${num+1}个任务失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 普通签到
 */
function doSign() {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/signin/setInfo`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 普通签到 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 普通签到 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    log(`普通签到成功`)
                } else if (result.code == -1) {
                    log(`普通签到失败，已签到过`)
                } else {
                    log(`普通签到失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 领取普通签到
 */
function getSignReward(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/signin/getRewa`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 领取普通签到 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 领取普通签到 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    if (result.data.sum) {
                        log(`领取普通签到成功`)
                    } else log(`领取普通签到失败，已领取过`)
                } else {
                    log(`领取普通签到失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 翻倍签到
 */
function doDoubleSign() {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/signin/setDoubleInfo`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 翻倍签到 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 翻倍签到 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    if (result.msg != "重复签到") {
                        log(`翻倍签到成功`)
                    } else log(`翻倍签到失败，已签到过`)
                } else {
                    log(`翻倍签到失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 领取翻倍签到
 */
function getDoubleSignReward(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/signin/getDoubleRewa`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 领取翻倍签到 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 领取翻倍签到 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    if (result.data.sum) {
                        log(`领取翻倍签到成功`)
                    } else log(`领取翻倍签到失败，已领取过`)
                } else {
                    log(`领取翻倍签到失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        }, timeout)
    })
}

/**
 * 获取信息
 */
function getInfo() {
    return new Promise((resolve) => {
        let url = {
            url: `https://point.jrongjie.com/web/user/getUserInfo`,
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 获取信息 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 获取信息 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1) {
                    integral = result.data.integral;
                    if (result.data.integral >= 100 && txBack == 1) {
                        if (autoWithdraw) {
                            if (integral >= 10000) {
                                log(`金币大于10000且填写了提现变量，执行自动提现10元`)
                                integral -= 10000;
                                await $.wait(randomInt(2000,5000));
                                withdraw(5);
                            } else if (integral >= 5000) {
                                log(`金币大于5000且填写了提现变量，执行自动提现5元`)
                                await $.wait(randomInt(2000,5000));
                                integral -= 5000;
                                withdraw(4);
                            } else if (integral >= 1000) {
                                log(`金币大于888且填写了提现变量，执行自动提现1元`)
                                integral -= 1000;
                                await $.wait(randomInt(2000,5000));
                                withdraw(3);
                            } else if (integral >= 500) {
                                log(`金币大于500且填写了提现变量，执行自动提现0.5元`)
                                integral -= 500;
                                await $.wait(randomInt(2000,5000));
                                withdraw(2);
                            } else if (integral >= 200) {
                                log(`金币大于200且填写了提现变量，执行自动提现0.2元`)
                                integral -= 200;
                                await $.wait(randomInt(2000,5000));
                                withdraw(1);
                            } else if (integral >= 100) {
                                log(`金币大于100且填写了提现变量，执行自动提现0.1元`)
                                integral -= 100;
                                await $.wait(randomInt(2000,5000));
                                withdraw(0);
                            }
                        }
                    } else if (result.data.integral >= 100 && txBack == 0) {
                        log(`提示：未填写提现变量，不会执行自动提现`)
                        msg += `\n提示：未填写提现变量，不会执行自动提现`
                    } else {
                        log(`金币小于100，不执行自动提现`)
                        msg += `\n金币小于100，不执行自动提现`
                    }
                } else {
                    log(`获取信息失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 提现
 */
function withdraw(num) {
    return new Promise((resolve) => {
        let url = {
            url: encodeURI(`https://point.jrongjie.com/web/exchange/receiveGoods?exchange_id=${txIdArr[num]}&type_id=1&user_phone=&account=${tx[0]}&real_name=${tx[1]}`),
            headers: {"Host":"point.jrongjie.com","accept":"application/json, text/plain, */*","authorization":`${hjqAU}`,"user-agent":`${ua}`},
        }

        if (debug) {
            log(`\n【debug】=============== 这是 提现 请求 url ===============`);
            log(JSON.stringify(url));
        }

        $.get(url, async (error, response, data) => {
            try {
                if (debug) {
                    log(`\n\n【debug】===============这是 提现 返回data==============`);
                    log(data)
                }

                let result = JSON.parse(data);
                if (result.code == 1 && result.msg == "兑换成功") {
                    log(`提现成功`)
                    msg += `\n提现成功`
                } else {
                    log(`提现失败，原因是：${result.msg}`)
                }

            } catch (e) {
                log(e)
            } finally {
                resolve();
            }
        })
    })
}

// ============================================重写============================================ \\
async function GetRewrite() {
    if ($request.url.indexOf("web/auth/app/login") > -1) {
        const ck = $request.url.match(/appId=[\w]+&uid=[0-9]+&secret=[\w]+/);
        if (hjq) {
            if (hjq.indexOf(ck) == -1) {
                hjq = hjq + "@" + ck;
                let List = hjq.split("@");
                $.setdata(hjq, "hjq");
                $.msg(`【${$.name}】` + ` 获取第${List.length}个 ck 成功: ${ck} ,不用请自行关闭重写!`);
            }
        } else {
            $.setdata(ck, "hjq");
            $.msg(`【${$.name}】` + ` 获取第1个 ck 成功: ${ck} ,不用请自行关闭重写!`);
        }
    }
}
 // ============================================变量检查============================================ \\
 async function Envs() {
     if (hjqTX) {
         if (hjqTX.indexOf("\n") != -1) {
             hjqTX.split("\n").forEach((item) => {
                 hjqTXArr.push(item);
             });
         } else {
             hjqTXArr.push(hjqTX);
         }
     } else {
         log(`\n提示：未填写提现变量，不会执行自动提现`)
     }

     if (hjq) {
         if (hjq.indexOf("@") != -1) {
             hjq.split("@").forEach((item) => {
                 hjqArr.push(item);
             });
         } else if (hjq.indexOf("\n") != -1) {
             hjq.split("\n").forEach((item) => {
                 hjqArr.push(item);
             });
         } else {
             hjqArr.push(hjq);
         }
     } else {
         log(`\n 【${$.name}】：未填写变量 hjq`)
         return;
     }

     if (hjqTXArr.length >= 1 && hjqArr.length != hjqTXArr.length) {
         log(`提示：请将提现变量与普通变量一一对应，否则会出现问题`)
     }
 
     return true;
 }
 
 // ============================================发送消息============================================ \\
 async function SendMsg(message) {
     if (!message)
         return;
 
     if (Notify > 0) {
         if ($.isNode()) {
             var notify = require('./sendNotify');
             await notify.sendNotify($.name, message);
         } else {
             $.msg(message);
         }
     } else {
         log(message);
     }
 }
 
 /**
  * 随机数生成
  */
 function randomString(e) {
     e = e || 32;
     var t = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890",
         a = t.length,
         n = "";
     for (i = 0; i < e; i++)
         n += t.charAt(Math.floor(Math.random() * a));
     return n
 }
 
 /**
  * 随机整数生成
  */
 function randomInt(min, max) {
     return Math.round(Math.random() * (max - min) + min)
 }

 /**
  * 获取毫秒时间戳
  */
 function timestampMs(){
    return new Date().getTime();
 }

 /**
  * 获取秒时间戳
  */
 function timestampS(){
    return Date.parse(new Date())/1000;
 }

 /**
  * 获取随机诗词
  */
 function poem(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://v1.jinrishici.com/all.json`
		}
		$.get(url, async (err, resp, data) => {
			try {
				data = JSON.parse(data)
				log(`${data.content}  \n————《${data.origin}》${data.author}`);
			} catch (e) {
				log(e, resp);
			} finally {
				resolve()
			}
		}, timeout)
	})
 }

 /**
  * 修改配置文件
  */
  function modify() {
                
    fs.readFile('/ql/data/config/config.sh','utf8',function(err,dataStr){
        if(err){
            return log('读取文件失败！'+err)
        }
        else {
            var result = dataStr.replace(/regular/g,string);
            fs.writeFile('/ql/data/config/config.sh', result, 'utf8', function (err) {
                     if (err) {return log(err);}
                });
            }
    })
 }

/**
 * 获取远程版本
 */
function getVersion(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://raw.gh.fakev.cn/LinYuanovo/scripts/main/hjq.js`,
        }
        $.get(url, async (err, resp, data) => {
            try {
                scriptVersionLatest = data.match(/scriptVersion = "([\d\.]+)"/)[1]
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        }, timeout)
    })
}

 function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `������${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============������系统通知������=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `������${this.name}, 结束! ������ ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
