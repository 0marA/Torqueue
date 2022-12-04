import { initializeApp } from "firebase/app";
import { getBlob, getBytes, getDownloadURL, getStorage, getStream, ref as sref, uploadBytes } from "firebase/storage";
import { getDatabase, ref as dref, get, set, child } from "firebase/database";
import { Part, Files } from "./Interfaces";
import dotenv from "dotenv";
import e from "express";
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const partsRef = sref(storage, "/parts_files");
const camRef = sref(storage, "/cam_files");

const db = getDatabase();
const dbRef = dref(getDatabase());

export const getAllPartsFB = async () => {
    let parts = [""];
    let error = false,
        errorMessage = "";

    await get(child(dbRef, `/`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                parts.push(snapshot.val());
            }
        })
        .catch((error) => {
            error = true;
            errorMessage = error;
        });

    if (error) return errorMessage;
    else return parts;
};

export const setPartFB = async (part: Part) => {
    let error = false,
        errorMessage = "";
    let location = "",
        data: any;

    //location = part.dev.delete ? "archive" : "active";
    console.log(part);
    location = "active";
    data = part.dev.delete ? null : part;

    await set(dref(db, `/${location}/${part.id}`), data).catch((e) => {
        console.log(e);
        error = true;
        errorMessage = e;
    });

    if (error) return errorMessage;
    else return "success";
};

export async function uploadPartFirebase(partFile: any, fileId: string, fileType: string) {
    let targetRef;
    let error = false;
    let errorMessage = "";

    if (fileType === "cam") targetRef = sref(storage, `cam_files/${fileId}`);
    else targetRef = sref(storage, `parts_files/${fileId}`);
    await uploadBytes(targetRef, partFile.buffer).catch((e) => {
        console.log(e);
        error = true;
        errorMessage = e; 
    });
    if (error) return errorMessage;
    return "success";
}

export async function getPartDownloadURLFirebase(fileId: string) {
    let targetRef = sref(storage, `parts_files/${fileId}`);
    return await getBytes(targetRef);
}
