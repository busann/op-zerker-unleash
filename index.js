const DEFAULT_HOOK_SETTINGS = {order: -1000000, filter: {fake: false}};
const JOB_ZERK = 3;

const SKILL_DEXTER = 340100;
const SKILL_SINISTER = 350100;
const CAST_INTERVAL = 120;

const SKILL_UNLEASH = 330100;
const SKILL_UNLEASH_LENGTH = 3966;
const UNLEASH_DURATION = 21000;


module.exports = function ZerkHue(dispatch) {
    const {command} = dispatch;

    let gameId,
        model,
        job,
        attackSpeed,
        xloc,
        yloc,
        zloc,
        wloc,
        enabled = false;

    let unleashInterval = null;
    let lastCast = SKILL_DEXTER;

    command.add('zerk', () => {
        enabled = !enabled;
        command.message(`Zerk skript: ${enabled}`);
    });

    dispatch.hook('S_LOGIN', 10, DEFAULT_HOOK_SETTINGS, event => {
        gameId = event.gameId;
        model = event.templateId;
        job = (model - 10101) % 100;
        enabled = [JOB_ZERK].includes(job);
    });

    dispatch.hook('C_PLAYER_LOCATION', 5, DEFAULT_HOOK_SETTINGS, event => {
        if (!enabled) return;

        xloc = event.dest.x;
        yloc = event.dest.y;
        zloc = event.dest.z;
        wloc = event.w;
    });

    dispatch.hook('S_PLAYER_STAT_UPDATE', 10, DEFAULT_HOOK_SETTINGS, event => {
        if(!enabled) return;

        attackSpeed = (event.attackSpeed + event.attackSpeedBonus) / event.attackSpeed;
        if (event.hp == 0) {
            clearInterval(unleashInterval);
            unleashInterval = null;
            lastCast = SKILL_DEXTER;
        }
    });

    dispatch.hook('C_START_SKILL', 7, DEFAULT_HOOK_SETTINGS, event => {
        if (!enabled) return;

        if ([SKILL_DEXTER, SKILL_SINISTER].includes(event.skill.id)) {
            return false;
        }
    });

    dispatch.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
        if (!enabled || !event.target.equals(gameId)) return;

        if (event.id == 401730) {
            const unleashFunction = () => {
                dispatch.toServer('C_START_SKILL', 7, {
                    skill: { reserved: 0, npc: false, type: 1, huntingZoneId: 0, id: lastCast },
                    w: wloc,
                    loc: {x: xloc, y: yloc, z: zloc + 2},
                    dest: {x: 0, y: 0, z: 0},
                    unk: true,
                    moving: false,
                    continue: false,
                    target: 0n,
                    unk2: false
                });

                lastCast = lastCast == SKILL_DEXTER ? SKILL_SINISTER : SKILL_DEXTER;
            };

            unleashInterval = setInterval(unleashFunction, CAST_INTERVAL);
            unleashFunction();

            setTimeout(() => {
                clearInterval(unleashInterval);
                unleashInterval = null;
                lastCast = SKILL_DEXTER;
            }, UNLEASH_DURATION);
        }
    });


    dispatch.hook('S_ACTION_STAGE', 8, {order: -1000000, filter: {fake: null}}, event => {
        if (!enabled || !event.gameId.equals(gameId)) return;

        if ([SKILL_DEXTER.toString().substring(0, 4), SKILL_SINISTER.toString().substring(0, 4)].includes(event.skill.id.toString().substring(0, 4))) {
            return false;
        }
    });

    dispatch.hook('S_ACTION_END', 5, {order: -1000000, filter: {fake: null}}, event => {
        if (!enabled || !event.gameId.equals(gameId)) return;

        if ([SKILL_DEXTER.toString().substring(0, 4), SKILL_SINISTER.toString().substring(0, 4)].includes(event.skill.id.toString().substring(0, 4))) {
            return false;
        }
    });
}
