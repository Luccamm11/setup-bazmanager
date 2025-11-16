import * as googleAuth from '../auth/googleAuth';

const SAVE_FILE_NAME = 'levelup_awakening_save.json';
let saveFileId: string | null = null;

// Finds the save file ID in the appDataFolder, caches it.
const findSaveFileId = async (): Promise<string | null> => {
    if (saveFileId) return saveFileId;

    const gapi = await googleAuth.getGapiClient();
    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            pageSize: 10,
        });

        const existingFile = response.result.files.find((file: any) => file.name === SAVE_FILE_NAME);
        if (existingFile) {
            saveFileId = existingFile.id;
            return saveFileId;
        }
        return null;
    } catch (error) {
        console.error("Error finding save file in Drive:", error);
        return null;
    }
};

// Creates a new save file in the appDataFolder.
const createSaveFile = async (): Promise<string | null> => {
    const gapi = await googleAuth.getGapiClient();
    const fileMetadata = {
        name: SAVE_FILE_NAME,
        parents: ['appDataFolder'],
    };
    try {
        const response = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        saveFileId = response.result.id;
        return saveFileId;
    } catch (error) {
        console.error("Error creating save file in Drive:", error);
        return null;
    }
};

// Ensures a save file exists and returns its ID.
const getOrCreateSaveFileId = async (): Promise<string | null> => {
    let fileId = await findSaveFileId();
    if (!fileId) {
        fileId = await createSaveFile();
    }
    return fileId;
};

// Loads data from the save file in Google Drive.
export const loadDataFromDrive = async (): Promise<any | null> => {
    const fileId = await findSaveFileId();
    if (!fileId) {
        console.log("No save file found in Google Drive.");
        return null; // No file exists yet, this is not an error.
    }

    const gapi = await googleAuth.getGapiClient();
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        
        // If the file is empty, the body might be an empty string or object
        if (!response.body || response.body.length === 0) {
            return null;
        }
        
        return JSON.parse(response.body);
    } catch (error) {
        console.error("Error loading data from Drive:", error);
        return null;
    }
};


// Saves the entire application state to the file in Google Drive.
export const saveDataToDrive = async (data: any): Promise<boolean> => {
    const fileId = await getOrCreateSaveFileId();
    if (!fileId) {
        console.error("Could not find or create a save file in Drive.");
        return false;
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
        mimeType: 'application/json',
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;
    
    const gapi = await googleAuth.getGapiClient();
    try {
        await gapi.client.request({
            path: `/upload/drive/v3/files/${fileId}`,
            method: 'PATCH',
            params: { uploadType: 'multipart' },
            headers: {
                'Content-Type': `multipart/related; boundary="${boundary}"`,
            },
            body: multipartRequestBody,
        });
        return true;
    } catch (error) {
        console.error("Error saving data to Drive:", error);
        return false;
    }
};