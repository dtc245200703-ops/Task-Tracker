import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, Footer, PageNumber, Header } from 'docx';

const source=await readFile('docs/bao-cao.md','utf8');
const lines=source.split(/\r?\n/),children=[];
const run=text=>new TextRun({text,font:'Times New Roman',size:26});
function paragraph(text,options={}) {return new Paragraph({children:[run(text.replace(/\*\*/g,'').replace(/`/g,''))],spacing:{after:140,line:340},alignment:AlignmentType.JUSTIFIED,...options});}
let inCover=true;
for(let i=0;i<lines.length;i++){
  const line=lines[i].trim();if(!line)continue;
  if(line==='## Mục lục')inCover=false;
  if(inCover){children.push(paragraph(line.replace(/^# /,''),{alignment:AlignmentType.CENTER,spacing:{before:i===0?600:140,after:200},children:[new TextRun({text:line.replace(/^# /,''),font:'Times New Roman',size:line.startsWith('# ')?32:28,bold:line.startsWith('# ')||line.startsWith('Đề tài')})]}));continue;}
  if(/^!\[/.test(line)){
    const match=line.match(/^!\[(.*?)\]\((.*?)\)$/);if(!match)continue;
    try{const data=await readFile(resolve('docs',match[2]));const width=data.readUInt32BE(16),height=data.readUInt32BE(20);const scale=Math.min(560/width,650/height);children.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new ImageRun({type:'png',data,transformation:{width:Math.round(width*scale),height:Math.round(height*scale)}})]}));children.push(paragraph(match[1],{alignment:AlignmentType.CENTER,children:[new TextRun({text:match[1],italic:true,size:22,font:'Times New Roman'})]}));}catch(e){throw new Error('Thiếu ảnh báo cáo: '+match[2]);}continue;
  }
  if(line.startsWith('|')){
    const tableLines=[];while(i<lines.length&&lines[i].trim().startsWith('|')){if(!/^\|[\s:|-]+\|$/.test(lines[i].trim()))tableLines.push(lines[i].trim());i++;}i--;
    const tableRows=tableLines.map((l,index)=>new TableRow({tableHeader:index===0,children:l.split('|').slice(1,-1).map(cell=>new TableCell({shading:index===0?{fill:'E6EEDF'}:undefined,children:[new Paragraph({spacing:{after:70},children:[new TextRun({text:cell.trim(),font:'Times New Roman',size:21,bold:index===0})]})]}))}));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:tableRows}));children.push(new Paragraph({text:''}));continue;
  }
  if(line.startsWith('## ')){const text=line.slice(3);children.push(paragraph(text,{heading:HeadingLevel.HEADING_1,pageBreakBefore:true,alignment:AlignmentType.LEFT,children:[new TextRun({text,bold:true,font:'Times New Roman',size:30})],spacing:{before:200,after:240}}));continue;}
  if(line.startsWith('### ')){const text=line.slice(4);children.push(paragraph(text,{heading:HeadingLevel.HEADING_2,alignment:AlignmentType.LEFT,keepNext:true,children:[new TextRun({text,bold:true,font:'Times New Roman',size:27})],spacing:{before:220,after:160}}));continue;}
  children.push(paragraph(line));
}
const doc=new Document({creator:'TaskFlow',title:'Báo cáo hệ thống quản lý công việc',description:'Node.js Express và MySQL – Đề tài 24',styles:{default:{document:{run:{font:'Times New Roman',size:26}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1701,right:1134}}},headers:{default:new Header({children:[new Paragraph({children:[new TextRun({text:'TASKFLOW · HỆ THỐNG QUẢN LÝ CÔNG VIỆC',size:18,color:'6A7D68'})],alignment:AlignmentType.RIGHT})]})},footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({children:['Trang ',PageNumber.CURRENT],size:22})]})]})},children}]});
await writeFile('docs/Bao-cao-TaskFlow.docx',await Packer.toBuffer(doc));
console.log('Đã xuất docs/Bao-cao-TaskFlow.docx, khổ A4, Times New Roman, ảnh thực tế và đánh số trang.');
