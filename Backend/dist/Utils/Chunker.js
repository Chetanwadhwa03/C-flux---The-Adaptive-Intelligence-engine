const getsafeoverlap = (text, overlapchars) => {
    if (overlapchars <= 0) {
        return "";
    }
    const rawoverlap = text.slice(-overlapchars);
    // If the chunk passed as an text , when we find the overlapping characters in it and find that that number it is by default space that means the next char is starting with the another word.
    if (text.charAt(text.length - 1 - overlapchars) === " ") {
        return rawoverlap.trim();
    }
    // If your are here means we have cutted through a word like having 'ple' of example and now we have to find the first space in that rawoverlap and we have to start from there that would evetually be the next word.
    const firstspaceindex = rawoverlap.indexOf(" ");
    // if the space does not exisit then the firstspaceindex = -1
    if (firstspaceindex != -1) {
        return rawoverlap.slice(firstspaceindex + 1).trim();
    }
    return rawoverlap.trim();
};
const chunker = (text, maxLength, overlap) => {
    // 1. Split the text in to the paragraphs 
    const paragraphs = text.split('\n\n');
    let currentChunk = "";
    const chunks = [];
    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        if (paragraph && paragraph.length > maxLength) {
            // a) split them in to the sentences , and store the chunk as the sentences
            const sentences = paragraph.split(". ");
            for (let sentence of sentences) {
                if (sentence.length > maxLength) {
                    const words = sentence.split(" ");
                    for (let word of words) {
                        // here we will not check the indivual word length greater than the maxlength, because if it happens 
                        // then just increase the chunk size
                        if (currentChunk.trim().length + word.length > maxLength) {
                            chunks.push(currentChunk.trim());
                            currentChunk = getsafeoverlap(currentChunk, overlap) + " " + word;
                        }
                        else {
                            currentChunk += (currentChunk ? " " : "") + word;
                        }
                    }
                    continue;
                }
                else {
                    // individual sentence length is less than max length
                    if (currentChunk.trim().length + sentence.length > maxLength) {
                        chunks.push(currentChunk.trim());
                        currentChunk = getsafeoverlap(currentChunk, overlap) + " " + sentence + ". ";
                    }
                    else {
                        // currentchunk length + new sentence length < maxlength : you will be just update the currentchunk
                        currentChunk += (currentChunk ? " " : "") + sentence + ". ";
                    }
                }
                continue;
            }
        }
        else {
            // paragraph.length <= maxLength, that means you can add the paragraph as the chunk in the chunks array.
            if (paragraph && currentChunk.trim().length + paragraph.length > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = getsafeoverlap(currentChunk, overlap) + "\n\n" + paragraph;
            }
            else {
                // already present chunk length + new paragraph length < maxlength
                currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            }
        }
    }
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
};
export default chunker;
//# sourceMappingURL=Chunker.js.map