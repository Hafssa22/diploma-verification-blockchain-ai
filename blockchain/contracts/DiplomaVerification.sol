// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiplomaVerification is ERC721URIStorage, Ownable {

    uint256 public nextTokenId;

    enum FraudStatus {
        NOT_ANALYZED,
        LEGITIMATE,
        SUSPICIOUS,
        FRAUDULENT
    }

    struct Diploma {
        string studentName;
        string diplomaTitle;
        string university;
        string fieldOfStudy;
        string issueDate;
        string diplomaHash;

        bool valid;

        FraudStatus fraudStatus;
        uint256 fraudScore;

        string aiReportHash;
    }

    mapping(uint256 => Diploma) public diplomas;

    event DiplomaMinted(
        uint256 indexed tokenId,
        address indexed student
    );

    event FraudAnalysisUpdated(
        uint256 indexed tokenId,
        FraudStatus status,
        uint256 fraudScore
    );

    event DiplomaRevoked(uint256 indexed tokenId);

    constructor()
    ERC721("Diploma Verification NFT", "DIP")
    Ownable()
    {}

    function mintDiploma(
        address student,
        string memory studentName,
        string memory diplomaTitle,
        string memory university,
        string memory fieldOfStudy,
        string memory issueDate,
        string memory diplomaHash,
        string memory metadataURI
    ) public onlyOwner {

        uint256 tokenId = nextTokenId;

        _safeMint(student, tokenId);

        _setTokenURI(tokenId, metadataURI);

        diplomas[tokenId] = Diploma({
            studentName: studentName,
            diplomaTitle: diplomaTitle,
            university: university,
            fieldOfStudy: fieldOfStudy,
            issueDate: issueDate,
            diplomaHash: diplomaHash,
            valid: true,
            fraudStatus: FraudStatus.NOT_ANALYZED,
            fraudScore: 0,
            aiReportHash: ""
        });

        nextTokenId++;

        emit DiplomaMinted(tokenId, student);
    }

    function updateFraudAnalysis(
        uint256 tokenId,
        FraudStatus status,
        uint256 fraudScore,
        string memory aiReportHash
    ) public onlyOwner {

        require(fraudScore <= 100, "Invalid score");

        diplomas[tokenId].fraudStatus = status;
        diplomas[tokenId].fraudScore = fraudScore;
        diplomas[tokenId].aiReportHash = aiReportHash;

        emit FraudAnalysisUpdated(
            tokenId,
            status,
            fraudScore
        );
    }

    function verifyDiploma(
        uint256 tokenId,
        string memory diplomaHash
    ) public view returns (bool) {

        Diploma memory d = diplomas[tokenId];

        return (
            d.valid &&
            d.fraudStatus != FraudStatus.FRAUDULENT &&
            keccak256(bytes(d.diplomaHash))
            == keccak256(bytes(diplomaHash))
        );
    }

    function revokeDiploma(
        uint256 tokenId
    ) public onlyOwner {

        diplomas[tokenId].valid = false;

        emit DiplomaRevoked(tokenId);
    }
}