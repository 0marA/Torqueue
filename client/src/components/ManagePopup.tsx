import { useState, useRef, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import "../index.css";
import { Part, Status } from "../Interfaces";
import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import { v4 as uuid4 } from "uuid";

type Props = {
    popupPart: Part;
    showPopup: boolean;
    BACKEND_URL: string;
    defaultPart: Part;
    addPart: any;
    name: string;
    setName: (name: string) => void;
    setShowPopup: (show: boolean) => void;
    setHotPart: (hotPart: Part) => void;
    setPopupPart: (hotPart: Part) => void;
    setAlert: (params: any) => void;
};

export default function ManagePopup({
    popupPart,
    setHotPart,
    showPopup,
    setShowPopup,
    setAlert,
    BACKEND_URL,
    defaultPart,
    setPopupPart,
    addPart,
    name,
    setName,
}: Props) {
    const [machine, setMachine] = useState(popupPart.machine);
    const [material, setMaterial] = useState(popupPart.machine);
    let [status, setStatus] = useState(popupPart.status);
    const [needed, setNeeded] = useState(popupPart.needed);
    const [priority, setPriority] = useState(popupPart.priority);
    const [notes, setNotes] = useState(popupPart.notes);
    const [popupName, setPopupName] = useState("");
    const [link, setLink] = useState(popupPart.link);
    const [project, setProject] = useState(popupPart.project);
    const [endmill, setEndmill] = useState(popupPart.endmill);
    const [creator, setCreator] = useState(popupPart.creator);

    const previousName = useRef("");
    const previousMachine = useRef("");
    const previousEndmill = useRef("");
    const previousProject = useRef("");
    const previousMaterial = useRef("");
    const previousStatus = useRef(0);
    const previousNeeded = useRef("");
    const previousPriority = useRef("1");
    const previousCreator = useRef("");
    const previousNotes = useRef("");
    const previousLink = useRef("");
    const overRideCAD = useRef(false);
    const overRideCAM = useRef(false);

    const [uploadFileType, setUploadFileType] = useState("cad");

    const openFileSelector = useRef(null);

    let fileUploadExtension = "";

    let hasUploaded = false;

    useEffect(() => {
        previousName.current = name;
        previousMachine.current = machine;
        previousProject.current = project;
        previousStatus.current = status;
        previousMaterial.current = material;
        previousNeeded.current = needed;
        previousPriority.current = priority;
        previousNotes.current = notes;
        previousLink.current = link;
        previousEndmill.current = endmill;
        previousCreator.current = creator;

        const statusKeyboardInput = (e: any) => {
            if (e.keyCode === 39) setStatus(++status);
            else if (e.keyCode === 37) setStatus(--status);
            else if (e.keyCode === 13) {
                e.preventDefault();
                savePartAndClose();
            }
        };

        window.addEventListener("keydown", statusKeyboardInput);
        return () => window.removeEventListener("keydown", statusKeyboardInput);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        name,
        machine,
        status,
        needed,
        priority,
        material,
        notes,
        project,
        link,
        endmill,
        creator,
    ]);

    useEffect(() => {
        setName(popupPart.name);
        setMachine(popupPart.machine);
        setEndmill(popupPart.endmill);
        setProject(popupPart.project);
        setStatus(popupPart.status);
        setNeeded(popupPart.needed);
        setPriority(popupPart.priority);
        setMaterial(popupPart.material);
        setNotes(popupPart.notes);
        setLink(popupPart.link);
        setCreator(popupPart.creator);
        if (addPart.current) {
            setPopupName("Add a Part");
            popupPart.id = uuid4();
            addPart.current = false;
            setName("");
        } else setPopupName(`Edit ${popupPart.name}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [popupPart, showPopup]);

    const handleFileUpload = async (e: { target: { files: any } }) => {
        hasUploaded = true;
        const { files } = e.target;
        if (files && files.length) {
            const parts = files[0].name.split(".");
            fileUploadExtension = parts[parts.length - 1];

            if (uploadFileType === "cad")
                popupPart.files.cadExt = fileUploadExtension;
            else popupPart.files.camExt = fileUploadExtension;

            const formData = new FormData();

            formData.append("fileId", popupPart.id);
            formData.append("fileType", uploadFileType);
            formData.append("partUpload", files[0]);

            const request = await axios({
                method: "POST",
                url: `${BACKEND_URL}/uploadPart`,
                headers: { "Content-Type": "multipart/form-data" },
                data: formData,
            });

            if (request.data === "success") {
                setAlert({
                    show: true,
                    message: "File Successfully Uploaded",
                    success: true,
                });

                setTimeout(() => {
                    setAlert({
                        show: false,
                        message: "",
                        success: false,
                    });
                }, 2000);

                if (name !== "") savePart();
            }
        }
    };

    const handleOpenFileSelector = (selectedFileType: string) => {
        if (
            selectedFileType === "cad" &&
            popupPart.files.cadExt !== "" &&
            !overRideCAD.current
        ) {
            alert(
                "This part already has A CAD file. Try to upload again to override the current one."
            );
            overRideCAD.current = true;
            return;
        }
        if (
            selectedFileType === "cam" &&
            popupPart.files.camExt !== "" &&
            !overRideCAM.current
        ) {
            alert(
                "This part already has A CAM file. Try to upload again to override the current one."
            );
            overRideCAM.current = true;
            return;
        }
    };

    const handleFileDownload = async (fileType: string) => {
        if (popupPart.files.camExt === "" && fileType === "cam") {
            alert("No GCODE Found");
            return;
        } else if (popupPart.files.cadExt === "" && fileType === "cad") {
            alert("No CAD File Found");
            return;
        }
        let fileExtension = fileType === "cad" ? "cad" : "cam";
        let params = {
            fileId: popupPart.id,
            fileExt: fileExtension,
            name: `${popupPart.name}-${fileType === "cad" ? "CAD" : "GCODE"}`,
        };

        await axios({
            url: `${BACKEND_URL}/downloadPart`,
            method: "GET",
            responseType: "blob",
            params: params,
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `${popupPart.name}-${fileType}.${
                    fileType === "cad"
                        ? popupPart.files.cadExt
                        : popupPart.files.camExt
                }`
            );
            document.body.appendChild(link);
            link.click();
        });
    };

    const savePart = () => {
        if (name === "") {
            alert("Please provide a name");
            return;
        }

        if (creator === "") {
            alert("Please provide a creator");
            return;
        }

        setHotPart({
            id: popupPart.id,
            name: name,
            status: status,
            material: material,
            machine: machine,
            endmill: endmill,
            needed: needed,
            priority: priority,
            project: project,
            creator: creator,
            link: link,
            files: {
                camExt: popupPart.files.camExt,
                cadExt: popupPart.files.cadExt,
            },
            notes: notes,
            dev: { delete: false },
        });
    };

    const savePartAndClose = () => {
        if (name === "") {
            alert("Please provide a name");
            return;
        }

        if (creator === "") {
            alert("Please provide a creator");
            return;
        }

        if (machine === "") {
            alert("Please provide a machine");
            return;
        }

        if (material === "") {
            alert("Please provide a material");
            return;
        }

        if (
            name !== popupPart.name ||
            machine !== popupPart.machine ||
            status !== popupPart.status ||
            needed !== popupPart.needed ||
            priority !== popupPart.priority ||
            material !== popupPart.material ||
            notes !== popupPart.notes ||
            project !== popupPart.project ||
            hasUploaded ||
            link !== popupPart.link ||
            creator !== popupPart.creator ||
            endmill !== popupPart.endmill
        ) {
            setHotPart({
                id: popupPart.id,
                name: name,
                status: status,
                material: material,
                endmill: endmill,
                machine: machine,
                needed: needed,
                priority: priority,
                creator: creator,
                project: project,
                link: link,
                files: {
                    camExt: popupPart.files.camExt,
                    cadExt: popupPart.files.cadExt,
                },
                notes: notes,
                dev: { delete: false },
            });

            setPopupPart(defaultPart);
        }

        setShowPopup(false);
    };

    const deletePart = () => {
        setHotPart({
            id: popupPart.id,
            name: popupPart.name,
            status: 0,
            material: "",
            machine: "",
            endmill: "",
            needed: "",
            priority: "",
            creator: "",
            project: "",
            notes: "",
            link: "",
            files: {
                camExt: popupPart.files.camExt,
                cadExt: popupPart.files.cadExt,
            },
            dev: { delete: true },
        });
        setShowPopup(false);
    };

    return (
        <>
            <Modal
                show={showPopup}
                onHide={() => {
                    setPopupPart(defaultPart);
                    setShowPopup(false);
                }}
            >
                <Modal.Header closeButton className="bg-black text-white">
                    <Modal.Title>{popupName}</Modal.Title>
                    <button
                        className="absolute right-5"
                        onClick={() => {
                            setPopupPart(defaultPart);
                            setShowPopup(false);
                        }}
                    >
                        X
                    </button>
                </Modal.Header>
                <Modal.Body className="bg-black text-white">
                    <div className="">
                        <label className="Popup">Name: </label>
                        <input
                            type="text"
                            autoFocus
                            className="form-control Popup w-50 BlackTextBox relative left-4"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <br />
                        <br />

                        <label className="Popup">Machine: </label>
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="primary"
                                className="ManagePopupDropdown"
                            >
                                {machine}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="ManagePopupDropdownMenu">
                                <Dropdown.Item
                                    onClick={() => setMachine("Tormach")}
                                >
                                    Tormach
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => setMachine("Nebula")}
                                >
                                    Nebula
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => setMachine("Omio")}
                                >
                                    Omio
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => setMachine("Lathe")}
                                >
                                    Lathe
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => setMachine("Mini Mill")}
                                >
                                    Mini Mill
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => setMachine("Any")}
                                >
                                    Any
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>

                        <br />
                        <label className="Popup">Project: </label>
                        <input
                            type="text"
                            className="form-control Popup w-50 BlackTextBox relative left-4"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                        />

                        <br />
                        <label className="Popup">Material: </label>
                        <input
                            type="text"
                            className="form-control Popup w-50 BlackTextBox relative left-4"
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                        />
                        <br />

                        <div className={` ${status === 4 ? "" : "hidden"}`}>
                            <label className="Popup">Endmill: </label>
                            <input
                                type="text"
                                className="form-control Popup w-50 BlackTextBox relative left-4"
                                value={endmill}
                                onChange={(e) => setEndmill(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="Popup">Creator: </label>
                            <input
                                type="text"
                                className="form-control Popup w-50 BlackTextBox relative left-4"
                                value={creator}
                                onChange={(e) => setCreator(e.target.value)}
                            />
                        </div>

                        <br />
                        <label className="Popup">Status: </label>
                        <button
                            className={`relative left-2 ${
                                status <= 0 ? "opacity-0" : ""
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                setStatus(--status);
                            }}
                        >
                            &#60;
                        </button>
                        <input
                            type="text"
                            className="form-control Popup w-50 BlackTextBox relative left-2"
                            value={
                                Object.values(Status)[status < 0 ? 0 : status]
                            }
                            onChange={(e) =>
                                setStatus(Math.max(0, parseInt(e.target.value)))
                            }
                        />
                        <button
                            className={`relative left-2 ${
                                status > 6 ? "opacity-0" : ""
                            }`}
                            onClick={(e) => {
                                e.preventDefault();
                                setStatus(++status);
                            }}
                        >
                            &#62;
                        </button>
                        <br />
                        <br />

                        <div className={` ${status === 1 ? "" : "hidden"}`}>
                            <label className="Popup">Link: </label>
                            <input
                                type="text"
                                className={`form-control Popup w-50 BlackTextBox relative left-4`}
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                            />
                            <br />
                            <br />
                        </div>

                        <div className="btn-group ">
                            <label className="Popup">Remaining: </label>

                            <input
                                type="button"
                                value="-"
                                className="btn btn-danger"
                                style={{ position: "relative", left: "3.25em" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const value =
                                        needed === "" ? 0 : parseInt(needed);
                                    setNeeded("" + Math.max(0, value - 1));
                                }}
                            />

                            <input
                                type="text"
                                className="outline outline-1 w-20 text-center relative text-black BlackTextBox"
                                value={needed}
                                style={{ position: "relative", left: "3.75em" }}
                                onChange={(e) => {
                                    e.preventDefault();
                                    setNeeded(e.target.value);
                                }}
                            />

                            <input
                                type="button"
                                value="+"
                                className="btn btn-success rounded-sm"
                                style={{ position: "relative", left: "4.25em" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const value =
                                        needed === "" ? 0 : parseInt(needed);
                                    setNeeded(value + 1 + "");
                                }}
                            />
                        </div>

                        <br />
                        <br />
                        <div className="btn-group ">
                            <label className="Popup">Priority: </label>
                            <input
                                type="button"
                                value="-"
                                className="btn btn-danger"
                                style={{ position: "relative", left: "3.25em" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const value =
                                        priority === ""
                                            ? 0
                                            : parseInt(priority);
                                    setPriority("" + Math.max(1, value - 1));
                                }}
                            />

                            <input
                                type="text"
                                className="outline outline-1 w-20 text-center relative text-black BlackTextBox"
                                style={{ position: "relative", left: "3.75em" }}
                                value={priority}
                                onChange={(e) => {
                                    e.preventDefault();
                                    setPriority(e.target.value);
                                }}
                            />

                            <input
                                type="button"
                                value="+"
                                className="btn btn-success rounded-sm"
                                style={{ position: "relative", left: "4.25em" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const value =
                                        priority === ""
                                            ? 0
                                            : parseInt(priority);
                                    setPriority(value + 1 + "");
                                }}
                            />
                        </div>

                        <br />

                        <label className="Popup NoteLabel">Notes: </label>
                        <textarea
                            placeholder="Add a note"
                            className="form-control Popup w-50 BlackTextBox NoteBox"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />

                        <br />
                        <br />
                        <button
                            type="button"
                            value="+"
                            className="btn btn-secondary left-11 rounded-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                if (openFileSelector.current !== null) {
                                    setUploadFileType("cad");
                                    handleOpenFileSelector("cad");
                                }
                            }}
                        >
                            Upload CAD
                        </button>
                        <button
                            type="button"
                            value="+"
                            className="btn btn-secondary left-11 rounded-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                handleFileDownload("cad");
                            }}
                        >
                            Download CAD
                        </button>

                        <button
                            type="button"
                            value="+"
                            className="btn btn-secondary left-11 rounded-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                if (openFileSelector.current !== null) {
                                    setUploadFileType("cam");
                                    handleOpenFileSelector("cam");
                                }
                            }}
                        >
                            Upload GCODE
                        </button>
                        <button
                            type="button"
                            value="+"
                            className="btn btn-secondary left-11 rounded-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                handleFileDownload("cam");
                            }}
                        >
                            Download GCODE
                        </button>
                    </div>
                </Modal.Body>

                <Modal.Footer className="bg-black">
                    <Button
                        variant="secondary"
                        className="btn btn-danger absolute left-3"
                        onClick={(e) => {
                            e.preventDefault();
                            deletePart();
                        }}
                    >
                        Delete
                    </Button>

                    <Button
                        variant="secondary"
                        className="btn btn-success"
                        type="submit"
                        onClick={(e) => {
                            e.preventDefault();
                            savePartAndClose();
                        }}
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>

            <input
                style={{ display: "none" }}
                ref={openFileSelector}
                onChange={handleFileUpload}
                type="file"
            />
        </>
    );
}
