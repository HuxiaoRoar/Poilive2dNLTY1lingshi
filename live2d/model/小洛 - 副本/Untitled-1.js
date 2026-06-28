
    class ke {
        constructor(t) {
            o(this, "leftParam"), o(this, "rightParam"), o(this,
                    "blinkInterval", 4e3), o(this,
                    "closingDuration", 100), o(this,
                    "closedDuration", 50), o(this,
                    "openingDuration", 150), o(this, "eyeState", 0),
                o(this, "eyeParamValue", 1), o(this, "closedTimer",
                    0), o(this, "nextBlinkTimeLeft", this
                    .blinkInterval), this.coreModel = t, this
                .leftParam = t.getParamIndex("PARAM_EYE_L_OPEN"),
                this.rightParam = t.getParamIndex(
                    "PARAM_EYE_R_OPEN")
        }
        setEyeParams(t) {
            this.eyeParamValue = d(t, 0, 1), this.coreModel
                .setParamFloat(this.leftParam, this.eyeParamValue),
                this.coreModel.setParamFloat(this.rightParam, this
                    .eyeParamValue)
        }
        update(t) {
            switch (this.eyeState) {
                case 0:
                    this.nextBlinkTimeLeft -= t, this
                        .nextBlinkTimeLeft < 0 && (this.eyeState =
                            1, this.nextBlinkTimeLeft = this
                            .blinkInterval + this.closingDuration +
                            this.closedDuration + this
                            .openingDuration + c(0, 2e3));
                    break;
                case 1:
                    this.setEyeParams(this.eyeParamValue + t / this
                            .closingDuration), this.eyeParamValue <=
                        0 && (this.eyeState = 2, this.closedTimer =
                            0);
                    break;
                case 2:
                    this.closedTimer += t, this.closedTimer >= this
                        .closedDuration && (this.eyeState = 3);
                    break;
                case 3:
                    this.setEyeParams(this.eyeParamValue + t / this
                            .openingDuration), this.eyeParamValue >=
                        1 && (this.eyeState = 0)
            }
        }
    }

    class Oi extends ci {
        constructor() {
            super(), this._eyeBlinkParameterIds = [], this
                ._lipSyncParameterIds = [], this._sourceFrameRate =
                30, this._loopDurationSeconds = -1, this._isLoop = !
                1, this._isLoopFadeIn = !0, this._lastWeight = 0,
                this._modelOpacity = 1
        }
        static create(t, e) {
            const i = new Oi;
            return i.parse(t), i._sourceFrameRate = i._motionData
                .fps, i._loopDurationSeconds = i._motionData
                .duration, i._onFinishedMotion = e, i
        }
        doUpdateParameters(t, e, i, s) {
            null == this._modelCurveIdEyeBlink && (this
                    ._modelCurveIdEyeBlink = "EyeBlink"), null ==
                this._modelCurveIdLipSync && (this
                    ._modelCurveIdLipSync = "LipSync"), null == this
                ._modelCurveIdOpacity && (this
                    ._modelCurveIdOpacity = Ii);
            let r = e - s.getStartTime();
            r < 0 && (r = 0);
            let o = Number.MAX_VALUE,
                n = Number.MAX_VALUE;
            const l = 64;
            let h = 0,
                u = 0;
            this._eyeBlinkParameterIds.length > l && ai(
                    "too many eye blink targets : {0}", this
                    ._eyeBlinkParameterIds.length), this
                ._lipSyncParameterIds.length > l && ai(
                    "too many lip sync targets : {0}", this
                    ._lipSyncParameterIds.length);
            const d = this._fadeInSeconds <= 0 ? 1 : qe
                .getEasingSine((e - s.getFadeInStartTime()) / this
                    ._fadeInSeconds),
                c = this._fadeOutSeconds <= 0 || s.getEndTime() <
                0 ? 1 : qe.getEasingSine((s.getEndTime() - e) / this
                    ._fadeOutSeconds);
            let g, m, p, _ = r;
            if (this._isLoop)
                for (; _ > this._motionData.duration;) _ -= this
                    ._motionData.duration;
            const f = this._motionData.curves;
            for (m = 0; m < this._motionData.curveCount && f[m]
                .type == xi.CubismMotionCurveTarget_Model; ++m) g =
                Ri(this._motionData, m, _), f[m].id == this
                ._modelCurveIdEyeBlink ? n = g : f[m].id == this
                ._modelCurveIdLipSync ? o = g : f[m].id == this
                ._modelCurveIdOpacity && (this._modelOpacity = g, t
                    .setModelOapcity(this.getModelOpacityValue()));
            for (; m < this._motionData.curveCount && f[m].type ==
                xi.CubismMotionCurveTarget_Parameter; ++m) {
                if (p = t.getParameterIndex(f[m].id), -1 == p)
                    continue;
                const r = t.getParameterValueByIndex(p);
                if (g = Ri(this._motionData, m, _), n != Number
                    .MAX_VALUE)
                    for (let t = 0; t < this._eyeBlinkParameterIds
                        .length && t < l; ++t)
                        if (this._eyeBlinkParameterIds[t] == f[m]
                            .id) {
                            g *= n, u |= 1 << t;
                            break
                        } if (o != Number.MAX_VALUE)
                    for (let t = 0; t < this._lipSyncParameterIds
                        .length && t < l; ++t)
                        if (this._lipSyncParameterIds[t] == f[m]
                            .id) {
                            g += o, h |= 1 << t;
                            break
                        } let a;
                if (f[m].fadeInTime < 0 && f[m].fadeOutTime < 0) a =
                    r + (g - r) * i;
                else {
                    let t, i;
                    t = f[m].fadeInTime < 0 ? d : 0 == f[m]
                        .fadeInTime ? 1 : qe.getEasingSine((e - s
                                .getFadeInStartTime()) / f[m]
                            .fadeInTime), i = f[m].fadeOutTime < 0 ?
                        c : 0 == f[m].fadeOutTime || s
                    .getEndTime() < 0 ? 1 : qe.getEasingSine((s
                                .getEndTime() - e) / f[m]
                            .fadeOutTime);
                    a = r + (g - r) * (this._weight * t * i)
                }
                t.setParameterValueByIndex(p, a, 1)
            }
            if (n != Number.MAX_VALUE)
                for (let a = 0; a < this._eyeBlinkParameterIds
                    .length && a < l; ++a) {
                    const e = t.getParameterValueById(this
                        ._eyeBlinkParameterIds[a]);
                    if (u >> a & 1) continue;
                    const s = e + (n - e) * i;
                    t.setParameterValueById(this
                        ._eyeBlinkParameterIds[a], s)
                }
            if (o != Number.MAX_VALUE)
                for (let a = 0; a < this._lipSyncParameterIds
                    .length && a < l; ++a) {
                    const e = t.getParameterValueById(this
                        ._lipSyncParameterIds[a]);
                    if (h >> a & 1) continue;
                    const s = e + (o - e) * i;
                    t.setParameterValueById(this
                        ._lipSyncParameterIds[a], s)
                }
            for (; m < this._motionData.curveCount && f[m].type ==
                xi.CubismMotionCurveTarget_PartOpacity; ++m)
                if (g = Ri(this._motionData, m, _), a
                    .setOpacityFromMotion) t.setPartOpacityById(f[m]
                    .id, g);
                else {
                    if (p = t.getParameterIndex(f[m].id), -1 == p)
                        continue;
                    t.setParameterValueByIndex(p, g)
                } r >= this._motionData.duration && (this._isLoop ?
                (s.setStartTime(e), this._isLoopFadeIn && s
                    .setFadeInStartTime(e)) : (this
                    ._onFinishedMotion && this
                    ._onFinishedMotion(this), s.setIsFinished(!
                        0))), this._lastWeight = i
        }
        setIsLoop(t) {
            this._isLoop = t
        }
        isLoop() {
            return this._isLoop
        }
        setIsLoopFadeIn(t) {
            this._isLoopFadeIn = t
        }
        isLoopFadeIn() {
            return this._isLoopFadeIn
        }
        getDuration() {
            return this._isLoop ? -1 : this._loopDurationSeconds
        }
        getLoopDuration() {
            return this._loopDurationSeconds
        }
        setParameterFadeInTime(t, e) {
            const i = this._motionData.curves;
            for (let s = 0; s < this._motionData.curveCount; ++s)
                if (t == i[s].id) return void(i[s].fadeInTime = e)
        }
        setParameterFadeOutTime(t, e) {
            const i = this._motionData.curves;
            for (let s = 0; s < this._motionData.curveCount; ++s)
                if (t == i[s].id) return void(i[s].fadeOutTime = e)
        }
        getParameterFadeInTime(t) {
            const e = this._motionData.curves;
            for (let i = 0; i < this._motionData.curveCount; ++i)
                if (t == e[i].id) return e[i].fadeInTime;
            return -1
        }
        getParameterFadeOutTime(t) {
            const e = this._motionData.curves;
            for (let i = 0; i < this._motionData.curveCount; ++i)
                if (t == e[i].id) return e[i].fadeOutTime;
            return -1
        }
        setEffectIds(t, e) {
            this._eyeBlinkParameterIds = t, this
                ._lipSyncParameterIds = e
        }
        release() {
            this._motionData = void 0
        }
        
    class Bi extends se {
        constructor(t, e) {
            var i;
            super(t, e), o(this, "definitions"), o(this, "groups", {
                    idle: "Idle"
                }), o(this, "motionDataType", "json"), o(this,
                    "queueManager", new pi), o(this,
                    "expressionManager"), o(this, "eyeBlinkIds"), o(
                    this, "lipSyncIds", ["ParamMouthOpenY"]), this
                .definitions = null != (i = t.motions) ? i : {},
                this.eyeBlinkIds = t.getEyeBlinkParameters() || [];
            const s = t.getLipSyncParameters();
            (null == s ? void 0 : s.length) && (this.lipSyncIds =
            s), this.init(e)
        }
        init(t) {
            super.init(t), this.settings.expressions && (this
                    .expressionManager = new fi(this.settings, t)),
                this.queueManager.setEventCallback(((t, e, i) => {
                    this.emit("motion:" + e)
                }))
        }
        isFinished() {
            return this.queueManager.isFinished()
        }
        _startMotion(t, e) {
            return t.setFinishedMotionHandler(e), this.queueManager
                .stopAllMotions(), this.queueManager.startMotion(t,
                    !1, performance.now())
        }
        _stopAllMotions() {
            this.queueManager.stopAllMotions()
        }
        createMotion(t, e, i) {
            const s = Oi.create(t),
                r = new Si(t),
                o = (e === this.groups.idle ? h
                    .idleMotionFadingDuration : h
                    .motionFadingDuration) / 1e3;
            return void 0 === r.getMotionFadeInTime() && s
                .setFadeInTime(i.FadeInTime > 0 ? i.FadeInTime : o),
                void 0 === r.getMotionFadeOutTime() && s
                .setFadeOutTime(i.FadeOutTime > 0 ? i.FadeOutTime :
                    o), s.setEffectIds(this.eyeBlinkIds, this
                    .lipSyncIds), s
        }
        getMotionFile(t) {
            return t.File
        }
        getMotionName(t) {
            return t.File
        }
        getSoundFile(t) {
            return t.Sound
        }
        updateParameters(t, e) {
            return this.queueManager.doUpdateMotion(t, e)
        }
        destroy() {
            super.destroy(), this.queueManager.release(), this
                .queueManager = void 0
        }
    }
    
        constructor(t) {
            var e, i;
            this._blinkingState = 0, this._nextBlinkingTime = 0,
                this._stateStartTimeSeconds = 0, this
                ._blinkingIntervalSeconds = 4, this
                ._closingSeconds = .1, this._closedSeconds =
                .05, this._openingSeconds = .15, this
                ._userTimeSeconds = 0, this._parameterIds = [],
                null != t && (this._parameterIds = null != (i =
                    null == (e = t
                .getEyeBlinkParameters()) ? void 0 : e
                    .slice()) ? i : this._parameterIds)
        }
        determinNextBlinkingTiming() {
            const t = Math.random();
            return this._userTimeSeconds + t * (2 * this
                ._blinkingIntervalSeconds - 1)
        }
    };
    
    const rs = new $e;
    class os extends oe {
        constructor(t, i, s) {
            super(), o(this, "settings"), o(this, "coreModel"), o(
                    this, "motionManager"), o(this, "lipSync", !0),
                o(this, "breath", ki.create()), o(this, "eyeBlink"),
                o(this, "userData"), o(this, "renderer", new ss), o(
                    this, "idParamAngleX", "ParamAngleX"), o(this,
                    "idParamAngleY", "ParamAngleY"), o(this,
                    "idParamAngleZ", "ParamAngleZ"), o(this,
                    "idParamEyeBallX", "ParamEyeBallX"), o(this,
                    "idParamEyeBallY", "ParamEyeBallY"), o(this,
                    "idParamBodyAngleX", "ParamBodyAngleX"), o(this,
                    "idParamBreath", "ParamBreath"), o(this,
                    "idParamMouthForm", "ParamMouthForm"), o(this,
                    "pixelsPerUnit", 1), o(this,
                    "centeringTransform", new e.Matrix), this
                .coreModel = t, this.settings = i, this
                .motionManager = new Bi(i, s), this.init()
        }
        init() {
            var t;
            super.init(), (null == (t = this.settings
                        .getEyeBlinkParameters()) ? void 0 : t
                    .length) && (this.eyeBlink = Ni.create(this
                    .settings)), this.breath.setParameters([new Ui(
                        this.idParamAngleX, 0, 15, 6.5345, .5),
                    new Ui(this.idParamAngleY, 0, 8, 3.5345,
                    .5), new Ui(this.idParamAngleZ, 0, 10,
                        5.5345, .5), new Ui(this
                        .idParamBodyAngleX, 0, 4, 15.5345, .5),
                    new Ui(this.idParamBreath, 0, .5, 3.2345,
                        .5)]), this.renderer.initialize(this
                    .coreModel), this.renderer
                .setIsPremultipliedAlpha(!0)
        }
        
        getDrawableIDs() {
            return this.coreModel.getDrawableIds()
        }
        getDrawableIndex(t) {
            return this.coreModel.getDrawableIndex(t)
        }
        getDrawableVertices(t) {
            if ("string" == typeof t && -1 === (t = this.coreModel
                    .getDrawableIndex(t))) throw new TypeError(
                "Unable to find drawable ID: " + t);
            const e = this.coreModel.getDrawableVertices(t).slice();
            for (let i = 0; i < e.length; i += 2) e[i] = e[i] * this
                .pixelsPerUnit + this.originalWidth / 2, e[i +
                1] = -e[i + 1] * this.pixelsPerUnit + this
                .originalHeight / 2;
            return e
        }
        updateTransform(t) {
            this.drawingMatrix.copyFrom(this.centeringTransform)
                .prepend(this.localTransform).prepend(t)
        }
        update(t, e) {
            var i, s, r, o;
            super.update(t, e), t /= 1e3, e /= 1e3;
            const n = this.coreModel;
            this.emit("beforeMotionUpdate");
            const a = this.motionManager.update(this.coreModel, e);
            if (this.emit("afterMotionUpdate"), n.saveParameters(),
                null == (i = this.motionManager
                .expressionManager) || i.update(n, e), a || null ==
                (s = this.eyeBlink) || s.updateParameters(n, t),
                this.updateFocus(), this.updateNaturalMovements(
                    1e3 * t, 1e3 * e), this.lipSync && this
                .motionManager.currentAudio) {
                let t = this.motionManager.mouthSync(),
                    e = 0;
                t > 0 && (e = .4), t = d(t * 1.2, e, 1);
                for (let i = 0; i < this.motionManager.lipSyncIds
                    .length; ++i) n.addParameterValueById(this
                    .motionManager.lipSyncIds[i], t, .8)
            }
            null == (r = this.physics) || r.evaluate(n, t), null ==
                (o = this.pose) || o.updateParameters(n, t), this
                .emit("beforeModelUpdate"), n.update(), n
                .loadParameters()
        }
       
        getEyeBlinkParameters() {
            var t, e;
            return null == (e = null == (t = this.groups) ? void 0 :
                    t.find((t => "EyeBlink" === t.Name))) ? void 0 :
                e.Ids
        }
        getLipSyncParameters() {
            var t, e;
            return null == (e = null == (t = this.groups) ? void 0 :
                    t.find((t => "LipSync" === t.Name))) ? void 0 :
                e.Ids
        }
    }
    class as extends v {
        constructor(t) {
            if (super(t), o(this, "moc"), o(this, "textures"), !as
                .isValidJSON(t)) throw new TypeError(
                "Invalid JSON.");
            Object.assign(this, new ns(t))
        }
        static isValidJSON(t) {
            var e;
            return !!(null == t ? void 0 : t.FileReferences) &&
                "string" == typeof t.FileReferences.Moc && (null ==
                    (e = t.FileReferences.Textures) ? void 0 : e
                    .length) > 0 && t.FileReferences.Textures.every(
                    (t => "string" == typeof t))
        }
        replaceFiles(t) {
            if (super.replaceFiles(t), this.motions)
                for (const [e, i] of Object.entries(this.motions))
                    for (let s = 0; s < i.length; s++) i[s].File =
                        t(i[s].File, `motions.${e}[${s}].File`),
                        void 0 !== i[s].Sound && (i[s].Sound = t(i[
                                s].Sound,
                            `motions.${e}[${s}].Sound`));
            if (this.expressions)
                for (let e = 0; e < this.expressions.length; e++)
                    this.expressions[e].File = t(this.expressions[e]
                        .File, `expressions[${e}].File`)
        }
    }
    