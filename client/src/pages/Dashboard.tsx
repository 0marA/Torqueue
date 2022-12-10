import TableHeader from "../components/TableHeader";
import Table from "react-bootstrap/Table";
import Dropdown from "react-bootstrap/Dropdown";
import { useEffect, useState, useRef } from "react";
import TableBody from "../components/TableBody";
import ManagePopup from "../components/ManagePopup";
import "../index.css";
import { Part } from "../Interfaces";
import axios from "axios";
import { classNames } from "@hkamran/utility-web";
import torqueueLogo from "../imgs/torqueueLogo.png";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { firebaseConfig } from "../keys";

const defaultPart = {
    id: "",
    name: "",
    status: 0,
    machine: "",
    material: "",
    needed: "0",
    priority: "5",
    notes: "",
    files: { camExt: "", cadExt: "" },
    dev: { delete: false, upload: false, download: false },
};

const numberSortArray = (a: any, b: any) => {
    return a > b ? 1 : a < b ? -1 : 0;
};

export default function Dashboard() {
    //const BACKEND_URL = "https://torqueue.texastorque.org";
    const BACKEND_URL = "http://localhost:5738";

    initializeApp(firebaseConfig);

    const [alert, setAlert] = useState({
        show: false,
        message: "",
        success: false,
    });

    const [popupPart, setPopupPart] = useState<Part>(defaultPart);
    const [showPopup, setShowPopup] = useState(false);
    const [hotPart, setHotPart] = useState<Part>(defaultPart);
    const [parts, setParts] = useState<Part[]>(null);
    const [name, setName] = useState("");

    const [filter, setFilter] = useState("Select a filter");
    const [searchQuery, setSearchQuery] = useState("");

    let addPart = useRef(false);

    const getParts = async () => {
        let responseJSON: any;
        let listParts = [] as Part[];
        await fetch(`${BACKEND_URL}/getAllParts`).then((response) =>
            response.json().then((data) => {
                responseJSON = data[1];
            })
        );

        for (let part in responseJSON) listParts.push(responseJSON[part]);

        listParts.sort((a, b) => {
            return numberSortArray(a.priority, b.priority);
        });

        setParts(listParts);
    };

    useEffect(() => {
        const db = getDatabase();
        const dbRef = ref(db, "/");
        onValue(dbRef, async () => {
            getParts();
        });
    }, []);

    useEffect(() => {
        const handleAsync = async () => {
            if (hotPart.id === "" || hotPart.name === "") return;

            let deleteStatus = "success",
                message = "";

            const successMessage = hotPart.dev.delete
                ? `Successfully Deleted ${hotPart.name}!`
                : `Successfully Changed ${hotPart.name}!`;

            const errorMessage = hotPart.dev.delete
                ? `Failed To Deleted ${hotPart.name}!`
                : `Failed To Change ${hotPart.name}!`;

            const setRequest = await axios.post(`${BACKEND_URL}/editPart`, {
                hotPart,
            });

            if (hotPart.dev.delete) {
                const deleteRequest = await axios.post(
                    `${BACKEND_URL}/deletePart`,
                    {
                        hotPart,
                    }
                );

                deleteStatus = deleteRequest.data;
            }

            getParts();

            message =
                setRequest.data === "success" && deleteStatus === "success"
                    ? successMessage
                    : errorMessage;

            setAlert({
                show: true,
                message: message,
                success: message === successMessage,
            });

            setTimeout(() => {
                setAlert({
                    show: false,
                    message: "",
                    success: false,
                });
            }, 2000);
        };

        handleAsync();
    }, [hotPart]);

    useEffect(() => {
        const statusKeyboardInput = (e: any) => {
            if (e.keyCode === 65 && !showPopup) handleAddPart();
        };

        window.addEventListener("keydown", statusKeyboardInput);
        return () => window.removeEventListener("keydown", statusKeyboardInput);
    });

    const handleAddPart = () => {
        addPart.current = true;
        setPopupPart(defaultPart);
        setShowPopup(true);
        setName("bruh");
    };

    return (
        <>
            <div
                className={classNames(
                    "fixed-top alert",
                    alert.success ? "alert-success" : "alert-danger"
                )}
                style={{ display: alert.show ? "" : "none" }}
            >
                {alert.message}
            </div>
            <div className="fixed-top navbar NavHead flex">
                <h2 className="flex pl-3">Filter: </h2>
                <Dropdown className="top-0 flex" style={{ paddingLeft: "1em" }}>
                    <Dropdown.Toggle variant="success">
                        {filter}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => setFilter("None")}>
                            None
                        </Dropdown.Item>
                        <Dropdown.Item
                            onClick={() => setFilter("All machines")}
                        >
                            All machines
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setFilter("Tormach")}>
                            Tormach
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setFilter("Nebula")}>
                            Nebula
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setFilter("Omio")}>
                            Omio
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setFilter("Lathe")}>
                            Lathe
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <img
                    src={torqueueLogo}
                    alt="TorqueueLogo"
                    className="h-12 Textenter TextCenterDiv"
                    style={{ position: "absolute", left: "43%", right: "50%" }}
                ></img>

                <div style={{ marginLeft: "auto" }}>
                    <input
                        type="text"
                        placeholder="Search"
                        className="SearchBar BlackTextBox form-control relative right-2"
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="TableGrandParent">
                <div className="TableParent">
                    {
                        <Table
                            striped
                            bordered
                            hover
                            variant="dark"
                            className="ActualTable"
                        >
                            <TableHeader />
                            <tbody>
                                <TableBody
                                    setPopupPart={setPopupPart}
                                    setHotPart={setHotPart}
                                    searchQuery={searchQuery}
                                    filter={filter}
                                    setShowPopup={setShowPopup}
                                    BACKEND_URL={BACKEND_URL}
                                    parts={parts}
                                />
                            </tbody>
                        </Table>
                    }
                </div>
            </div>

            <ManagePopup
                popupPart={popupPart}
                setPopupPart={setPopupPart}
                setHotPart={setHotPart}
                setShowPopup={setShowPopup}
                showPopup={showPopup}
                setAlert={setAlert}
                BACKEND_URL={BACKEND_URL}
                defaultPart={defaultPart}
                addPart={addPart}
                name={name}
                setName={setName}
            />

            <button
                type="button"
                className="AddPartButton"
                onClick={() => handleAddPart()}
            >
                +
            </button>
        </>
    );
}
