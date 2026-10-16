
function nonStatSnapshot(cat)
  local ids={} for id,d in pairs(cat.items)do if d.type=="EQUIP" then table.insert(ids,id) end end table.sort(ids)
  local out={}
  local statKeys={"attack","magic","defense","maxhp","maxmp","speed","jump","accuracy","avoid","ignoredef"}
  local gems={"DIAMOND","SAPPHIRE","AMETHYST","AQUAMARINE","GARNET","OPAL","TOPAZ","EMERALD"}
  for _,id in ipairs(ids)do
    local def=cat.items[id]
    for lv=0,3 do
      local result=cat:ComputeEnhance(def,lv,nil)
      local line=id.."|"..lv
      for _,k in ipairs(statKeys)do line=line.."|"..k.."="..tostring(result.fixed[k]or 0) end
      if lv>0 then for _,g in ipairs(gems)do line=line.."|"..g.."="..tostring(cat:GemAmount(def,lv,g)) end end
      table.insert(out,line)
    end
  end
  return table.concat(out,"\n")
end

return nonStatSnapshot(ItemCatalog)
