import crypto from 'crypto';

const JWT_SECRET = "super_secret_key_task_manager";

interface IPayload{
    id: string;
}

function toBase64Url(str: string){
    return Buffer.from(str)
            .toString('base64')
            .replace(/=/g,'')
            .replace(/\+/g,'-')   
            .replace(/\//g,'_')         
}

function fromBase64Url(base64Url: string){
    let base64 = base64Url
                .replace(/-/g, '+')
                .replace(/_/g,'/');
    while (base64.length % 4) base64 += '=';
    return Buffer.from(base64, 'base64').toString('utf-8');
}

export function generateToken(payload: IPayload){
    const header = { alg: 'HS256', typ: 'JWT'};
    const encodeHeader = toBase64Url(JSON.stringify(header));
    const encodePayload : BufferEncoding = toBase64Url(JSON.stringify(payload)) as BufferEncoding;
    const signature = crypto.createHmac('sha256', JWT_SECRET)
                            .update(`${encodeHeader}`, `${encodePayload}`)
                            .digest('base64url');
    return `${encodeHeader}.${encodePayload}.${signature}`;
}

export function verifyToken(token: string){
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length != 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const bufferEncodedPayload: BufferEncoding = encodedPayload as BufferEncoding;
    const validateSignature = crypto.createHmac('sha256', JWT_SECRET)
                            .update(`${encodedHeader}`, `${bufferEncodedPayload}`)
                            .digest('base64url');
    if (signature != validateSignature) return null;
    return JSON.parse(fromBase64Url(encodedPayload));    
}