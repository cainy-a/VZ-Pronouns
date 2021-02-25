import React from "react";
import { UserProfile } from "@vizality/components";

export function userProfile() {
    const owo = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
    const ogUseMemo = owo.useMemo;
    const ogUseState = owo.useState;
    const ogUseCallback = owo.useCallback;
    const ogUseContext = owo.useContext;
    const ogUseEffect = owo.useEffect;
    const ogUseLayoutEffect = owo.useLayoutEffect;
    const ogUseRef = owo.useRef;
    const ogUseReducer = owo.useReducer;

    owo.useMemo = (f) => f();
    owo.useState = (v) => [v, () => void 0];
    owo.useCallback = (v) => v;
    owo.useContext = (ctx) => ctx._currentValue;
    owo.useEffect = () => null;
    owo.useLayoutEffect = () => null;
    owo.useRef = () => ({});
    owo.useReducer = () => ({});

    const profile = new UserProfile({}).type;

    owo.useMemo = ogUseMemo;
    owo.useState = ogUseState;
    owo.useCallback = ogUseCallback;
    owo.useContext = ogUseContext;
    owo.useEffect = ogUseEffect;
    owo.useLayoutEffect = ogUseLayoutEffect;
    owo.useRef = ogUseRef;
    owo.useReducer = ogUseReducer;

    return profile;
}